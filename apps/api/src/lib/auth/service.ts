import type { PublicUser } from "../db/types";
import type { AuthStore, GoogleIdentity } from "./store";

type AuthServiceErrorCode =
    | "MISSING_ENV"
    | "TOKEN_EXCHANGE_FAILED"
    | "INVALID_ID_TOKEN"
    | "JWKS_FETCH_FAILED"
    | "UNKNOWN";

export class AuthServiceError extends Error {
    readonly code: AuthServiceErrorCode;
    readonly status?: number;
    readonly details?: string;

    constructor(
        message: string,
        options: {
            code: AuthServiceErrorCode;
            status?: number;
            details?: string;
        },
    ) {
        super(message);
        this.name = "AuthServiceError";
        this.code = options.code;
        this.status = options.status;
        this.details = options.details;
    }
}

export interface GoogleAuthEnv {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    [key: string]: unknown;
}

export interface AuthSessionResult {
    user: PublicUser;
    sessionId: string;
    expiresAt: Date;
}

interface GoogleAuthServiceOptions {
    fetchImpl?: typeof fetch;
    now?: () => Date;
    verifyIdToken?: (
        idToken: string,
        clientId: string,
    ) => Promise<GoogleIdentity>;
    sessionTtlMs?: number;
}

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const DEFAULT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class GoogleAuthService {
    private readonly fetchImpl: typeof fetch;
    private readonly now: () => Date;
    private readonly verifyIdToken: (
        idToken: string,
        clientId: string,
    ) => Promise<GoogleIdentity>;
    private readonly sessionTtlMs: number;

    constructor(
        private readonly store: AuthStore,
        private readonly env: GoogleAuthEnv,
        options: GoogleAuthServiceOptions = {},
    ) {
        this.fetchImpl =
            options.fetchImpl ?? ((input, init) => fetch(input, init));
        this.now = options.now ?? (() => new Date());
        this.verifyIdToken =
            options.verifyIdToken ??
            ((idToken, clientId) =>
                verifyGoogleIdToken(
                    idToken,
                    clientId,
                    () => this.now().getTime(),
                    this.fetchImpl,
                ));
        this.sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
    }

    getAuthorizationUrl(state: string): string {
        const url = new URL(GOOGLE_AUTHORIZATION_URL);
        url.searchParams.set(
            "client_id",
            this.getRequiredEnv("GOOGLE_CLIENT_ID"),
        );
        url.searchParams.set(
            "redirect_uri",
            this.getRequiredEnv("GOOGLE_REDIRECT_URI"),
        );
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", "openid email profile");
        url.searchParams.set("state", state);
        return url.toString();
    }

    async handleCallback(code: string): Promise<AuthSessionResult> {
        const clientId = this.getRequiredEnv("GOOGLE_CLIENT_ID");
        const body = new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: this.getRequiredEnv("GOOGLE_CLIENT_SECRET"),
            redirect_uri: this.getRequiredEnv("GOOGLE_REDIRECT_URI"),
            grant_type: "authorization_code",
        });

        const response = await this.fetchImpl(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        });

        if (!response.ok) {
            const details = await readGoogleErrorDetails(response);
            throw new AuthServiceError("Google token exchange failed", {
                code: "TOKEN_EXCHANGE_FAILED",
                status: response.status,
                details,
            });
        }

        let tokenResponse: { id_token?: unknown };
        try {
            tokenResponse = (await response.json()) as { id_token?: unknown };
        } catch {
            throw new AuthServiceError(
                "Google token response was not valid JSON",
                {
                    code: "TOKEN_EXCHANGE_FAILED",
                },
            );
        }

        if (typeof tokenResponse.id_token !== "string") {
            throw new AuthServiceError(
                "Google token response missing ID token",
                {
                    code: "INVALID_ID_TOKEN",
                },
            );
        }

        const identity = await this.verifyIdToken(
            tokenResponse.id_token,
            clientId,
        );
        const user = await this.store.upsertGoogleUser(identity);
        const expiresAt = new Date(this.now().getTime() + this.sessionTtlMs);
        const sessionId = await this.store.createSession(user.id, expiresAt);

        return { user, sessionId, expiresAt };
    }

    async getUser(sessionId: string | null): Promise<PublicUser | null> {
        if (!sessionId) {
            return null;
        }

        return this.store.getUserBySessionId(sessionId, this.now());
    }

    async logout(sessionId: string | null): Promise<void> {
        if (!sessionId) {
            return;
        }

        await this.store.deleteSession(sessionId);
    }

    private getRequiredEnv(key: keyof GoogleAuthEnv): string {
        const value = this.env[key];
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new AuthServiceError(`Missing required auth env ${key}`, {
                code: "MISSING_ENV",
            });
        }

        return value;
    }
}

export async function verifyGoogleIdToken(
    idToken: string,
    clientId: string,
    nowMs: () => number = Date.now,
    fetchImpl: typeof fetch = (input, init) => fetch(input, init),
): Promise<GoogleIdentity> {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
        throw invalidToken("ID token must have three parts");
    }

    const header = parseJwtPart(parts[0]) as {
        alg?: unknown;
        kid?: unknown;
    };
    const claims = parseJwtPart(parts[1]) as {
        iss?: unknown;
        aud?: unknown;
        exp?: unknown;
        sub?: unknown;
        email?: unknown;
        email_verified?: unknown;
        name?: unknown;
        picture?: unknown;
    };

    if (header.alg !== "RS256" || typeof header.kid !== "string") {
        throw invalidToken("ID token header is not a Google RS256 key");
    }

    const jwksResponse = await fetchImpl(GOOGLE_JWKS_URL);
    if (!jwksResponse.ok) {
        throw new AuthServiceError("Unable to fetch Google signing keys", {
            code: "JWKS_FETCH_FAILED",
        });
    }

    const jwks = (await jwksResponse.json()) as {
        keys?: (JsonWebKey & { kid?: string })[];
    };
    const key = jwks.keys?.find((candidate) => candidate.kid === header.kid);
    if (!key) {
        throw invalidToken("No matching Google signing key found");
    }

    const cryptoKey = await crypto.subtle.importKey(
        "jwk",
        key,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"],
    );
    const verified = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        base64UrlToBytes(parts[2]),
        new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );

    if (!verified) {
        throw invalidToken("Invalid Google ID token signature");
    }

    validateClaims(claims, clientId, nowMs);

    return {
        sub: claims.sub as string,
        email: claims.email as string,
        name:
            typeof claims.name === "string" && claims.name.trim().length > 0
                ? claims.name
                : (claims.email as string),
        picture: typeof claims.picture === "string" ? claims.picture : null,
    };
}

function validateClaims(
    claims: {
        iss?: unknown;
        aud?: unknown;
        exp?: unknown;
        sub?: unknown;
        email?: unknown;
        email_verified?: unknown;
    },
    clientId: string,
    nowMs: () => number = Date.now,
) {
    if (
        claims.iss !== "https://accounts.google.com" &&
        claims.iss !== "accounts.google.com"
    ) {
        throw invalidToken("Invalid Google ID token issuer");
    }
    if (claims.aud !== clientId) {
        throw invalidToken("Invalid Google ID token audience");
    }
    if (
        typeof claims.exp !== "number" ||
        claims.exp <= Math.floor(nowMs() / 1000)
    ) {
        throw invalidToken("Google ID token is expired");
    }
    if (typeof claims.sub !== "string" || claims.sub.length === 0) {
        throw invalidToken("Google ID token missing subject");
    }
    if (typeof claims.email !== "string" || claims.email.length === 0) {
        throw invalidToken("Google ID token missing email");
    }
    if (claims.email_verified !== true) {
        throw invalidToken("Google ID token email is not verified");
    }
}

function parseJwtPart(part: string): unknown {
    try {
        return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
    } catch {
        throw invalidToken("Unable to parse Google ID token");
    }
}

function base64UrlToBytes(value: string): Uint8Array {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
        normalized.length + ((4 - (normalized.length % 4)) % 4),
        "=",
    );
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function invalidToken(message: string): AuthServiceError {
    return new AuthServiceError(message, { code: "INVALID_ID_TOKEN" });
}

async function readGoogleErrorDetails(
    response: Response,
): Promise<string | undefined> {
    const raw = await response.text().catch(() => "");
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        return undefined;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        try {
            const parsed = JSON.parse(trimmed) as {
                error?: unknown;
                error_description?: unknown;
            };
            const error =
                typeof parsed.error === "string" ? parsed.error.trim() : "";
            const description =
                typeof parsed.error_description === "string"
                    ? parsed.error_description.trim()
                    : "";
            const details = [error, description].filter(Boolean).join(": ");
            return truncateLogDetail(details || trimmed);
        } catch {
            return truncateLogDetail(trimmed);
        }
    }

    return truncateLogDetail(trimmed);
}

function truncateLogDetail(value: string): string {
    return value.length > 240 ? `${value.slice(0, 240)}...` : value;
}
