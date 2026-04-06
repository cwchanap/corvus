import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate, debounce, sleep } from "../src/utils";
import { formatRelativeTime } from "../src/utils/format-relative-time";

describe("formatDate", () => {
    it("formats a date in long US format", () => {
        const date = new Date("2024-01-15T00:00:00Z");
        const result = formatDate(date);
        // The exact string depends on timezone, but should contain year, month name, and day
        expect(result).toMatch(/2024/);
        expect(result).toMatch(/\d+/);
    });

    it("returns a non-empty string", () => {
        expect(formatDate(new Date())).toBeTruthy();
    });
});

describe("debounce", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("delays execution until after the wait period", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced("a");
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledOnce();
        expect(fn).toHaveBeenCalledWith("a");
    });

    it("resets the timer on repeated calls within the wait period", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced("first");
        vi.advanceTimersByTime(50);
        debounced("second");
        vi.advanceTimersByTime(50);
        // Only 50 ms since the second call – should NOT have fired yet
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledOnce();
        expect(fn).toHaveBeenCalledWith("second");
    });

    it("fires multiple times when calls are spaced beyond the wait period", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced("first");
        vi.advanceTimersByTime(200);
        debounced("second");
        vi.advanceTimersByTime(200);

        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenNthCalledWith(1, "first");
        expect(fn).toHaveBeenNthCalledWith(2, "second");
    });
});

describe("formatRelativeTime", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-06-01T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns 'just now' for invalid timestamps", () => {
        expect(formatRelativeTime("not-a-date")).toBe("just now");
    });

    it("returns 'just now' for timestamps within the last 60 seconds", () => {
        const ts = new Date("2024-06-01T11:59:30Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("just now");
    });

    it("returns '1 minute ago' for exactly 1 minute", () => {
        const ts = new Date("2024-06-01T11:59:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("1 minute ago");
    });

    it("returns 'N minutes ago' for multiple minutes", () => {
        const ts = new Date("2024-06-01T11:45:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("15 minutes ago");
    });

    it("returns '1 hour ago' for exactly 1 hour", () => {
        const ts = new Date("2024-06-01T11:00:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("1 hour ago");
    });

    it("returns 'N hours ago' for multiple hours", () => {
        const ts = new Date("2024-06-01T06:00:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("6 hours ago");
    });

    it("returns 'yesterday' for timestamps 1 day ago", () => {
        const ts = new Date("2024-05-31T12:00:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("yesterday");
    });

    it("returns 'N days ago' for multiple days", () => {
        const ts = new Date("2024-05-22T12:00:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("10 days ago");
    });

    it("returns '1 month ago' for ~30 days", () => {
        const ts = new Date("2024-05-01T12:00:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("1 month ago");
    });

    it("returns 'N months ago' for multiple months", () => {
        const ts = new Date("2024-03-01T12:00:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("3 months ago");
    });

    it("returns '1 year ago' for ~365 days", () => {
        const ts = new Date("2023-06-01T12:00:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("1 year ago");
    });

    it("returns 'N years ago' for multiple years", () => {
        const ts = new Date("2022-01-01T12:00:00Z").toISOString();
        expect(formatRelativeTime(ts)).toBe("2 years ago");
    });
});

describe("sleep", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("resolves after the specified delay", async () => {
        const resolved = vi.fn();
        sleep(200).then(resolved);

        expect(resolved).not.toHaveBeenCalled();
        vi.advanceTimersByTime(200);
        await Promise.resolve(); // flush microtasks
        expect(resolved).toHaveBeenCalledOnce();
    });

    it("returns a Promise", () => {
        const result = sleep(0);
        expect(result).toBeInstanceOf(Promise);
        vi.runAllTimers();
    });
});
