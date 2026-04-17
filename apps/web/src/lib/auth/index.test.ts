import { describe, it, expect } from "vitest";
import { AuthProvider, useAuth } from "./index";

describe("lib/auth barrel export", () => {
    it("re-exports AuthProvider", () => {
        expect(AuthProvider).toBeDefined();
        expect(typeof AuthProvider).toBe("function");
    });

    it("re-exports useAuth", () => {
        expect(useAuth).toBeDefined();
        expect(typeof useAuth).toBe("function");
    });
});
