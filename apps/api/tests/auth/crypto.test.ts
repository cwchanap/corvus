import {
    generateSessionId,
    hashPassword,
    verifyPassword,
} from "../../src/lib/auth/crypto.ts";

describe("crypto helpers", () => {
    it("hashes passwords and verifies them successfully", async () => {
        const password = "S3cure#Password";

        const hash = await hashPassword(password);
        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(40);

        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
    });

    it("rejects incorrect passwords and malformed hashes", async () => {
        const password = "another-passphrase";
        const hash = await hashPassword(password);

        await expect(verifyPassword("wrong-pass", hash)).resolves.toBe(false);
        await expect(verifyPassword(password, "not-base64")).resolves.toBe(
            false,
        );
    });

    it("generates unique url-safe session ids", () => {
        const first = generateSessionId();
        const second = generateSessionId();

        expect(first).not.toBe(second);
        expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(first.length).toBeGreaterThanOrEqual(42);
        expect(first.length).toBeLessThanOrEqual(44);
    });
});
