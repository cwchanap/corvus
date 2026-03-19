/**
 * These tests exist purely to exercise the barrel re-export files (index.ts)
 * in src/lib/auth and src/lib/db, which are otherwise 0% covered because
 * other tests import directly from sub-modules.
 */
import { describe, it, expect } from "vitest";
import {
    SupabaseAuthService,
    createSupabaseServerClient,
    requireAuth,
} from "../../src/lib/auth";
import { createDatabase } from "../../src/lib/db";
import { createDefaultCategories } from "../../src/lib/db/index";

describe("auth barrel (src/lib/auth/index.ts)", () => {
    it("exports SupabaseAuthService", () => {
        expect(SupabaseAuthService).toBeDefined();
        expect(typeof SupabaseAuthService).toBe("function");
    });

    it("exports createSupabaseServerClient", () => {
        expect(createSupabaseServerClient).toBeDefined();
        expect(typeof createSupabaseServerClient).toBe("function");
    });

    it("exports requireAuth", () => {
        expect(requireAuth).toBeDefined();
        expect(typeof requireAuth).toBe("function");
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
