import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthStore, GoogleIdentity } from "../../src/lib/auth/store";
import {
    AuthServiceError,
    GoogleAuthService,
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
});
