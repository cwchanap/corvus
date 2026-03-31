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

    it("keeps duplicate warnings while another visible link still uses the previous URL", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "https://duplicate.example/item",
                description: "",
                isPrimary: false,
                isNew: true,
            },
            {
                url: "https://duplicate.example/item",
                description: "",
                isPrimary: false,
                isNew: true,
            },
        ]);

        let handleUrlChange!: (index: number, url: string) => void;
        let duplicateWarnings!: () => Record<number, string | null>;
        let dispose!: () => void;

        createRoot((rootDispose) => {
            dispose = rootDispose;
            mockUseCheckDuplicateUrl.mockImplementation(
                (urlAccessor: () => string) => ({
                    get data() {
                        const currentUrl = urlAccessor();
                        if (!currentUrl) return undefined;
                        if (currentUrl === "https://duplicate.example/item") {
                            return {
                                isDuplicate: true,
                                conflictingItem: {
                                    id: "item-1",
                                    title: "Existing duplicate",
                                    categoryId: "cat-1",
                                },
                            };
                        }
                        return {
                            isDuplicate: false,
                            conflictingItem: null,
                        };
                    },
                }),
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

            handleUrlChange = hook.handleUrlChange;
            duplicateWarnings = hook.duplicateWarnings;
        });

        handleUrlChange(0, "https://duplicate.example/item");
        vi.advanceTimersByTime(400);

        expect(duplicateWarnings()).toEqual({
            0: "Existing duplicate",
            1: "Existing duplicate",
        });

        handleUrlChange(0, "https://unique.example/item");
        vi.advanceTimersByTime(400);

        expect(duplicateWarnings()).toEqual({
            0: null,
            1: "Existing duplicate",
        });

        dispose();
    });
});
