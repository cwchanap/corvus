/**
 * These tests exist purely to exercise the barrel re-export files (index.ts)
 * in src/lib/auth and src/lib/db, which are otherwise 0% covered because
 * other tests import directly from sub-modules.
 */
import { describe, it, expect } from "vitest";
import {
    GoogleAuthService,
    AuthServiceError,
    createD1AuthStore,
    requireAuth,
    OAUTH_STATE_COOKIE_NAME,
    SESSION_COOKIE_NAME,
    buildExpiredCookie,
    buildSetCookie,
    readCookie,
} from "../../src/lib/auth";
import {
    createDatabase,
    createDefaultCategories,
} from "../../src/lib/db/index";

describe("auth barrel (src/lib/auth/index.ts)", () => {
    it("exports GoogleAuthService", () => {
        expect(GoogleAuthService).toBeDefined();
        expect(typeof GoogleAuthService).toBe("function");
    });

    it("exports createD1AuthStore", () => {
        expect(createD1AuthStore).toBeDefined();
        expect(typeof createD1AuthStore).toBe("function");
    });

    it("exports requireAuth", () => {
        expect(requireAuth).toBeDefined();
        expect(typeof requireAuth).toBe("function");
    });

    it("exports AuthServiceError", () => {
        expect(AuthServiceError).toBeDefined();
        expect(typeof AuthServiceError).toBe("function");
    });

    it("exports OAUTH_STATE_COOKIE_NAME", () => {
        expect(OAUTH_STATE_COOKIE_NAME).toBeDefined();
        expect(typeof OAUTH_STATE_COOKIE_NAME).toBe("string");
    });

    it("exports SESSION_COOKIE_NAME", () => {
        expect(SESSION_COOKIE_NAME).toBeDefined();
        expect(typeof SESSION_COOKIE_NAME).toBe("string");
    });

    it("exports buildExpiredCookie", () => {
        expect(buildExpiredCookie).toBeDefined();
        expect(typeof buildExpiredCookie).toBe("function");
    });

    it("exports buildSetCookie", () => {
        expect(buildSetCookie).toBeDefined();
        expect(typeof buildSetCookie).toBe("function");
    });

    it("exports readCookie", () => {
        expect(readCookie).toBeDefined();
        expect(typeof readCookie).toBe("function");
    });
});

describe("db barrel (src/lib/db/index.ts)", () => {
    it("exports createDatabase", () => {
        expect(createDatabase).toBeDefined();
        expect(typeof createDatabase).toBe("function");
    });

    it("exports createDefaultCategories", () => {
        expect(createDefaultCategories).toBeDefined();
        expect(typeof createDefaultCategories).toBe("function");
    });
});
