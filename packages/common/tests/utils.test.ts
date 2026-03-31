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
    it("returns 'just now' for invalid timestamps", () => {
        expect(formatRelativeTime("not-a-date")).toBe("just now");
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
