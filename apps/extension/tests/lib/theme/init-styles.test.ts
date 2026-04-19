import { describe, it, expect, beforeEach } from "vitest";
import { applyThemeVariables } from "../../../src/lib/theme/init-styles";

// The module applies light theme on import as a side effect.
// We reset the document style before each test to ensure isolation.
beforeEach(() => {
  document.documentElement.removeAttribute("style");
});

describe("applyThemeVariables", () => {
  describe("light theme", () => {
    it("sets background to light value", () => {
      applyThemeVariables("light");
      expect(
        document.documentElement.style.getPropertyValue("--background"),
      ).toBe("0 0% 100%");
    });

    it("sets foreground to light value", () => {
      applyThemeVariables("light");
      expect(
        document.documentElement.style.getPropertyValue("--foreground"),
      ).toBe("222.2 84% 4.9%");
    });

    it("sets primary to light value", () => {
      applyThemeVariables("light");
      expect(
        document.documentElement.style.getPropertyValue("--primary"),
      ).toBe("210 40% 98%");
    });

    it("sets destructive to light value", () => {
      applyThemeVariables("light");
      expect(
        document.documentElement.style.getPropertyValue("--destructive"),
      ).toBe("0 84.2% 60.2%");
    });

    it("sets border to light value", () => {
      applyThemeVariables("light");
      expect(
        document.documentElement.style.getPropertyValue("--border"),
      ).toBe("214.3 31.8% 91.4%");
    });

    it("sets radius", () => {
      applyThemeVariables("light");
      expect(
        document.documentElement.style.getPropertyValue("--radius"),
      ).toBe("0.5rem");
    });
  });

  describe("dark theme", () => {
    it("sets background to dark value", () => {
      applyThemeVariables("dark");
      expect(
        document.documentElement.style.getPropertyValue("--background"),
      ).toBe("222.2 84% 4.9%");
    });

    it("sets foreground to dark value", () => {
      applyThemeVariables("dark");
      expect(
        document.documentElement.style.getPropertyValue("--foreground"),
      ).toBe("210 40% 98%");
    });

    it("sets primary to dark value", () => {
      applyThemeVariables("dark");
      expect(
        document.documentElement.style.getPropertyValue("--primary"),
      ).toBe("222.2 47.4% 11.2%");
    });

    it("sets destructive to dark value", () => {
      applyThemeVariables("dark");
      expect(
        document.documentElement.style.getPropertyValue("--destructive"),
      ).toBe("0 62.8% 30.6%");
    });

    it("sets border to dark value", () => {
      applyThemeVariables("dark");
      expect(
        document.documentElement.style.getPropertyValue("--border"),
      ).toBe("217.2 32.6% 17.5%");
    });
  });

  it("overwrites previous theme variables when switching", () => {
    applyThemeVariables("dark");
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe("222.2 84% 4.9%");

    applyThemeVariables("light");
    expect(
      document.documentElement.style.getPropertyValue("--background"),
    ).toBe("0 0% 100%");
  });

  it("applies all light variables to document root", () => {
    applyThemeVariables("light");
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--secondary")).toBe("210 40% 96%");
    expect(style.getPropertyValue("--accent")).toBe("210 40% 96%");
    expect(style.getPropertyValue("--muted")).toBe("210 40% 96%");
    expect(style.getPropertyValue("--card")).toBe("0 0% 100%");
    expect(style.getPropertyValue("--popover")).toBe("0 0% 100%");
    expect(style.getPropertyValue("--ring")).toBe("222.2 84% 4.9%");
    expect(style.getPropertyValue("--input")).toBe("214.3 31.8% 91.4%");
  });

  it("applies all dark variables to document root", () => {
    applyThemeVariables("dark");
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--secondary")).toBe("217.2 32.6% 17.5%");
    expect(style.getPropertyValue("--accent")).toBe("217.2 32.6% 17.5%");
    expect(style.getPropertyValue("--muted")).toBe("217.2 32.6% 17.5%");
    expect(style.getPropertyValue("--card")).toBe("222.2 84% 4.9%");
    expect(style.getPropertyValue("--popover")).toBe("222.2 84% 4.9%");
    expect(style.getPropertyValue("--ring")).toBe("212.7 26.8% 83.9%");
    expect(style.getPropertyValue("--input")).toBe("217.2 32.6% 17.5%");
  });
});
