/**
 * Exercises the graphql/index.ts barrel re-export so it shows up as covered.
 */
import { describe, it, expect } from "vitest";
import { graphqlRequest } from "../src/graphql/index";

describe("graphql barrel (src/graphql/index.ts)", () => {
    it("re-exports graphqlRequest", () => {
        expect(typeof graphqlRequest).toBe("function");
    });
});
