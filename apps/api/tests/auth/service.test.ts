import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthStore, GoogleIdentity } from "../../src/lib/auth/store";
import {
    AuthServiceError,
    GoogleAuthService,
    verifyGoogleIdToken,
} from "../../src/lib/auth/service";

const fixedNow = new Date("2026-05-20T12:00:00.000Z");
const env = {
    GOOGLE_CLIENT_ID: "google-client-id",
    GOOGLE_CLIENT_SECRET: "google-client-secret",
    GOOGLE_REDIRECT_URI: "https://app.example.com/auth/google/callback",
};

const user = {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada Lovelace",
    created_at: "2026-05-20T12:00:00.000Z",
    updated_at: "2026-05-20T12:00:00.000Z",
};

function createStore(overrides: Partial<AuthStore> = {}): AuthStore {
    return {
        upsertGoogleUser: vi.fn().mockResolvedValue(user),
        createSession: vi.fn().mockResolvedValue("session-123"),
        getUserBySessionId: vi.fn().mockResolvedValue(user),
        deleteSession: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function createTokenResponseFetch(status = 200, body: unknown = {}) {
    return vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json" },
        }),
    ) as unknown as typeof fetch;
}

describe("GoogleAuthService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("builds a Google authorization URL with state", () => {
        const service = new GoogleAuthService(createStore(), env);

        const url = new URL(service.getAuthorizationUrl("state-123"));

        expect(url.origin + url.pathname).toBe(
            "https://accounts.google.com/o/oauth2/v2/auth",
        );
        expect(url.searchParams.get("client_id")).toBe("google-client-id");
        expect(url.searchParams.get("redirect_uri")).toBe(
            "https://app.example.com/auth/google/callback",
        );
        expect(url.searchParams.get("response_type")).toBe("code");
        expect(url.searchParams.get("scope")).toBe("openid email profile");
        expect(url.searchParams.get("state")).toBe("state-123");
    });

    it("rejects a callback when Google token exchange fails", async () => {
        const service = new GoogleAuthService(createStore(), env, {
            fetchImpl: createTokenResponseFetch(400, {
                error: "invalid_grant",
            }),
            now: () => fixedNow,
            verifyIdToken: vi.fn(),
        });

        await expect(service.handleCallback("bad-code")).rejects.toMatchObject({
            code: "TOKEN_EXCHANGE_FAILED",
        });
    });

    it("exchanges a code, verifies identity, upserts user, and creates a session", async () => {
        const identity: GoogleIdentity = {
            sub: "google-sub-1",
            email: "ada@example.com",
            name: "Ada Lovelace",
            picture: "https://example.com/avatar.png",
        };
        const store = createStore();
        const verifyIdToken = vi.fn().mockResolvedValue(identity);
        const fetchImpl = createTokenResponseFetch(200, {
            id_token: "header.payload.signature",
        });
        const service = new GoogleAuthService(store, env, {
            fetchImpl,
            now: () => fixedNow,
            verifyIdToken,
        });

        const result = await service.handleCallback("oauth-code");

        expect(fetchImpl).toHaveBeenCalledWith(
            "https://oauth2.googleapis.com/token",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                },
            }),
        );
        const body = new URLSearchParams(
            (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0][1]
                .body as string,
        );
        expect(body.get("code")).toBe("oauth-code");
        expect(body.get("client_id")).toBe("google-client-id");
        expect(body.get("client_secret")).toBe("google-client-secret");
        expect(body.get("redirect_uri")).toBe(
            "https://app.example.com/auth/google/callback",
        );
        expect(body.get("grant_type")).toBe("authorization_code");
        expect(verifyIdToken).toHaveBeenCalledWith(
            "header.payload.signature",
            "google-client-id",
        );
        expect(store.upsertGoogleUser).toHaveBeenCalledWith(identity);
        expect(store.createSession).toHaveBeenCalledWith(
            "user-1",
            new Date("2026-06-19T12:00:00.000Z"),
        );
        expect(result).toEqual({
            user,
            sessionId: "session-123",
            expiresAt: new Date("2026-06-19T12:00:00.000Z"),
        });
    });

    it("returns null when no session id is present", async () => {
        const store = createStore();
        const service = new GoogleAuthService(store, env);

        await expect(service.getUser(null)).resolves.toBeNull();
        expect(store.getUserBySessionId).not.toHaveBeenCalled();
    });

    it("deletes the current session on logout", async () => {
        const store = createStore();
        const service = new GoogleAuthService(store, env);

        await service.logout("session-123");

        expect(store.deleteSession).toHaveBeenCalledWith("session-123");
    });

    it("does not throw when logout has no session id", async () => {
        const store = createStore();
        const service = new GoogleAuthService(store, env);

        await expect(service.logout(null)).resolves.toBeUndefined();
        expect(store.deleteSession).not.toHaveBeenCalled();
    });

    it("uses typed auth service errors", () => {
        const error = new AuthServiceError("bad oauth", {
            code: "TOKEN_EXCHANGE_FAILED",
        });

        expect(error.name).toBe("AuthServiceError");
        expect(error.code).toBe("TOKEN_EXCHANGE_FAILED");
    });

    it("throws MISSING_ENV when GOOGLE_CLIENT_ID is not set for authorization URL", () => {
        const service = new GoogleAuthService(createStore(), {
            GOOGLE_CLIENT_SECRET: "secret",
            GOOGLE_REDIRECT_URI: "https://example.com/callback",
        });

        expect(() => service.getAuthorizationUrl("state")).toThrowError(
            "Missing required auth env GOOGLE_CLIENT_ID",
        );
    });

    it("throws MISSING_ENV when GOOGLE_REDIRECT_URI is empty for authorization URL", () => {
        const service = new GoogleAuthService(createStore(), {
            GOOGLE_CLIENT_ID: "id",
            GOOGLE_CLIENT_SECRET: "secret",
            GOOGLE_REDIRECT_URI: "  ",
        });

        expect(() => service.getAuthorizationUrl("state")).toThrowError(
            "Missing required auth env GOOGLE_REDIRECT_URI",
        );
    });

    it("throws when token response has no id_token", async () => {
        const service = new GoogleAuthService(createStore(), env, {
            fetchImpl: createTokenResponseFetch(200, {
                access_token: "at",
            }),
            verifyIdToken: vi.fn(),
        });

        await expect(service.handleCallback("code")).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
        });
    });

    it("returns the user when a valid session id is provided", async () => {
        const store = createStore();
        const service = new GoogleAuthService(store, env);

        const result = await service.getUser("session-123");

        expect(result).toEqual(user);
        expect(store.getUserBySessionId).toHaveBeenCalledWith(
            "session-123",
            expect.any(Date),
        );
    });
});

async function generateRsaKeyPair() {
    return crypto.subtle.generateKey(
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
        },
        true,
        ["sign", "verify"],
    );
}

function toBase64Url(data: string | ArrayBuffer): string {
    const bytes =
        typeof data === "string"
            ? new TextEncoder().encode(data)
            : new Uint8Array(data);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function createSignedJwt(
    privateKey: CryptoKey,
    header: Record<string, unknown>,
    payload: Record<string, unknown>,
): Promise<string> {
    const headerB64 = toBase64Url(JSON.stringify(header));
    const payloadB64 = toBase64Url(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        new TextEncoder().encode(signingInput),
    );
    return `${signingInput}.${toBase64Url(signature)}`;
}

function stubJwksFetch(keyPair: CryptoKeyPair, kid: string) {
    return async () => {
        const publicKeyJwk = await crypto.subtle.exportKey(
            "jwk",
            keyPair.publicKey,
        );
        return new Response(
            JSON.stringify({ keys: [{ ...publicKeyJwk, kid }] }),
            {
                status: 200,
                headers: { "content-type": "application/json" },
            },
        );
    };
}

describe("verifyGoogleIdToken", () => {
    const clientId = "google-client-id";

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("verifies a valid Google ID token", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "https://accounts.google.com",
            aud: clientId,
            exp: now + 3600,
            sub: "google-sub-1",
            email: "test@example.com",
            email_verified: true,
            name: "Test User",
            picture: "https://example.com/avatar.png",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        const identity = await verifyGoogleIdToken(token, clientId);

        expect(identity).toEqual({
            sub: "google-sub-1",
            email: "test@example.com",
            name: "Test User",
            picture: "https://example.com/avatar.png",
        });
    });

    it("uses email as name when name is empty", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "https://accounts.google.com",
            aud: clientId,
            exp: now + 3600,
            sub: "google-sub-1",
            email: "test@example.com",
            email_verified: true,
            name: "  ",
            picture: "https://example.com/avatar.png",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        const identity = await verifyGoogleIdToken(token, clientId);
        expect(identity.name).toBe("test@example.com");
    });

    it("returns null picture when picture is not a string", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "https://accounts.google.com",
            aud: clientId,
            exp: now + 3600,
            sub: "google-sub-1",
            email: "test@example.com",
            email_verified: true,
            name: "Test User",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        const identity = await verifyGoogleIdToken(token, clientId);
        expect(identity.picture).toBeNull();
    });

    it("accepts accounts.google.com as issuer", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "accounts.google.com",
            aud: clientId,
            exp: now + 3600,
            sub: "google-sub-1",
            email: "test@example.com",
            email_verified: true,
            name: "Test User",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        const identity = await verifyGoogleIdToken(token, clientId);
        expect(identity.sub).toBe("google-sub-1");
    });

    it("rejects token with wrong number of parts", async () => {
        await expect(
            verifyGoogleIdToken("not.enough", clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "ID token must have three parts",
        });
    });

    it("rejects token with non-RS256 algorithm", async () => {
        const keyPair = await generateRsaKeyPair();
        const now = Math.floor(Date.now() / 1000);

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "ES256", kid: "key-id" },
            {
                iss: "https://accounts.google.com",
                aud: clientId,
                exp: now + 3600,
            },
        );

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "ID token header is not a Google RS256 key",
        });
    });

    it("rejects token when kid is not a string", async () => {
        const keyPair = await generateRsaKeyPair();
        const now = Math.floor(Date.now() / 1000);

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256" },
            {
                iss: "https://accounts.google.com",
                aud: clientId,
                exp: now + 3600,
            },
        );

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "ID token header is not a Google RS256 key",
        });
    });

    it("rejects token with unparseable JWT parts", async () => {
        await expect(
            verifyGoogleIdToken("ew.ew.ew", clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Unable to parse Google ID token",
        });
    });

    it("rejects token when JWKS returns no keys array", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            {
                iss: "https://accounts.google.com",
                aud: clientId,
                exp: now + 3600,
            },
        );
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(new Response("error", { status: 500 })),
        );

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Unable to fetch Google signing keys",
        });
    });

    it("rejects token when no matching signing key is found", async () => {
        const keyPair = await generateRsaKeyPair();
        const wrongKeyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            {
                iss: "https://accounts.google.com",
                aud: clientId,
                exp: now + 3600,
            },
        );
        vi.stubGlobal("fetch", stubJwksFetch(wrongKeyPair, "different-kid"));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "No matching Google signing key found",
        });
    });

    it("rejects token with invalid signature", async () => {
        const signingKeyPair = await generateRsaKeyPair();
        const jwksKeyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const token = await createSignedJwt(
            signingKeyPair.privateKey,
            { alg: "RS256", kid },
            {
                iss: "https://accounts.google.com",
                aud: clientId,
                exp: now + 3600,
            },
        );
        vi.stubGlobal("fetch", stubJwksFetch(jwksKeyPair, kid));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Invalid Google ID token signature",
        });
    });

    it("rejects token with invalid issuer", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "https://evil.example.com",
            aud: clientId,
            exp: now + 3600,
            sub: "google-sub-1",
            email: "test@example.com",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Invalid Google ID token issuer",
        });
    });

    it("rejects token with wrong audience", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "https://accounts.google.com",
            aud: "wrong-client-id",
            exp: now + 3600,
            sub: "google-sub-1",
            email: "test@example.com",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Invalid Google ID token audience",
        });
    });

    it("rejects expired token", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";

        const claims = {
            iss: "https://accounts.google.com",
            aud: clientId,
            exp: Math.floor(Date.now() / 1000) - 3600,
            sub: "google-sub-1",
            email: "test@example.com",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Google ID token is expired",
        });
    });

    it("rejects token with non-number exp", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";

        const claims = {
            iss: "https://accounts.google.com",
            aud: clientId,
            exp: "not-a-number",
            sub: "google-sub-1",
            email: "test@example.com",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Google ID token is expired",
        });
    });

    it("rejects token with missing subject", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "https://accounts.google.com",
            aud: clientId,
            exp: now + 3600,
            sub: "",
            email: "test@example.com",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Google ID token missing subject",
        });
    });

    it("rejects token with missing email", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "https://accounts.google.com",
            aud: clientId,
            exp: now + 3600,
            sub: "google-sub-1",
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Google ID token missing email",
        });
    });

    it("rejects token with unverified email", async () => {
        const keyPair = await generateRsaKeyPair();
        const kid = "test-key-id";
        const now = Math.floor(Date.now() / 1000);

        const claims = {
            iss: "https://accounts.google.com",
            aud: clientId,
            exp: now + 3600,
            sub: "google-sub-1",
            email: "test@example.com",
            email_verified: false,
        };

        const token = await createSignedJwt(
            keyPair.privateKey,
            { alg: "RS256", kid },
            claims,
        );
        vi.stubGlobal("fetch", stubJwksFetch(keyPair, kid));

        await expect(
            verifyGoogleIdToken(token, clientId),
        ).rejects.toMatchObject({
            code: "INVALID_ID_TOKEN",
            message: "Google ID token email is not verified",
        });
    });
});
