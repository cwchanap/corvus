import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getD1 } from "../../src/lib/cloudflare";

describe("getD1", () => {
  const originalGlobalDb = (globalThis as { DB?: unknown }).DB;

  afterEach(() => {
    (globalThis as { DB?: unknown }).DB = originalGlobalDb;
  });

  it("returns database from context env when present", () => {
    const d1 = { name: "d1-binding" };
    const context = { env: { DB: d1 } } as any;

    expect(getD1(context)).toBe(d1);
  });

  it("falls back to globalThis.DB binding", () => {
    const d1 = { name: "global-d1" };
    (globalThis as { DB?: unknown }).DB = d1;

    expect(getD1()).toBe(d1);
  });

  it("throws a helpful error when database binding missing", () => {
    (globalThis as { DB?: unknown }).DB = undefined;

    expect(() => getD1()).toThrowError(/D1 database binding not found/i);
  });
});
