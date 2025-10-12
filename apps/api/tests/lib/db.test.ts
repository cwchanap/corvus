import { afterEach, describe, expect, it, vi } from "vitest";

const drizzleMock = vi.fn();

vi.mock("drizzle-orm/d1", () => {
  return {
    drizzle: drizzleMock,
  };
});

describe("createDatabase", () => {
  afterEach(() => {
    drizzleMock.mockClear();
  });

  it("delegates to drizzle with schema", async () => {
    const fakeDb = { exec: vi.fn() } as any;
    const fakeResult = { select: vi.fn() };
    drizzleMock.mockReturnValue(fakeResult);

    const { createDatabase } = await import("../../src/lib/db");
    const result = createDatabase(fakeDb);

    expect(drizzleMock).toHaveBeenCalledWith(fakeDb, {
      schema: expect.any(Object),
    });
    expect(result).toBe(fakeResult);
  });
});
