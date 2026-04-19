import { describe, it, expect } from "vitest";

describe("utils/page-info re-export", () => {
  it("re-exports getCurrentPageInfo from @repo/common", async () => {
    const extensionModule = await import("../../src/utils/page-info");
    const commonModule = await import("@repo/common/utils/page-info");

    expect(extensionModule.getCurrentPageInfo).toBe(commonModule.getCurrentPageInfo);
  });

  it("getCurrentPageInfo is a function", async () => {
    const { getCurrentPageInfo } = await import("../../src/utils/page-info");
    expect(typeof getCurrentPageInfo).toBe("function");
  });
});
