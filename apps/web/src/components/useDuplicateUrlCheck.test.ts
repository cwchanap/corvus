import { createRoot, createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LinkItem } from "./useLinkManager";
import { useDuplicateUrlCheck } from "./useDuplicateUrlCheck";

const mockUseCheckDuplicateUrl = vi.fn();

vi.mock("../lib/graphql/hooks/use-wishlist", () => ({
    useCheckDuplicateUrl: (...args: unknown[]) =>
        mockUseCheckDuplicateUrl(...args),
}));

describe("useDuplicateUrlCheck", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockUseCheckDuplicateUrl.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("clears pending duplicate checks during cleanup", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "",
                description: "",
                isPrimary: false,
                isNew: true,
            },
        ]);

        let capturedUrlAccessor!: () => string;
        let cleanup!: () => void;
        let handleUrlChange!: (index: number, url: string) => void;
        let dispose!: () => void;

        createRoot((rootDispose) => {
            dispose = rootDispose;
            mockUseCheckDuplicateUrl.mockImplementation(
                (urlAccessor: () => string) => {
                    capturedUrlAccessor = urlAccessor;
                    return { data: undefined };
                },
            );

            const hook = useDuplicateUrlCheck({
                links,
                updateLink: (index, field, value) => {
                    setLinks((previous) =>
                        previous.map((link, itemIndex) =>
                            itemIndex === index
                                ? ({
                                      ...link,
                                      [field]: value,
                                  } as LinkItem)
                                : link,
                        ),
                    );
                },
            });

            cleanup = hook.cleanup;
            handleUrlChange = hook.handleUrlChange;
        });

        handleUrlChange(0, "https://example.com/item");
        expect(capturedUrlAccessor()).toBe("");

        cleanup();
        vi.advanceTimersByTime(400);

        expect(capturedUrlAccessor()).toBe("");
        dispose();
    });
});
