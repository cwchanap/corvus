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

    it("normalizes duplicate lookups and warning matching", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "",
                description: "",
                isPrimary: false,
                isNew: true,
            },
        ]);

        const queriedUrls: string[] = [];
        let handleUrlChange!: (index: number, url: string) => void;
        let duplicateWarnings!: () => Record<number, string | null>;
        let dispose!: () => void;

        createRoot((rootDispose) => {
            dispose = rootDispose;
            mockUseCheckDuplicateUrl.mockImplementation(
                (urlAccessor: () => string) => {
                    return {
                        get data() {
                            queriedUrls.push(urlAccessor());
                            if (
                                urlAccessor() ===
                                "https://duplicate.example/item?a=1&b=2"
                            ) {
                                return {
                                    isDuplicate: true,
                                    conflictingItem: {
                                        id: "item-1",
                                        title: "Existing duplicate",
                                        categoryId: "cat-1",
                                    },
                                };
                            }

                            return undefined;
                        },
                    };
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

            handleUrlChange = hook.handleUrlChange;
            duplicateWarnings = hook.duplicateWarnings;
        });

        handleUrlChange(0, "  HTTPS://duplicate.example:443/item/?b=2&a=1  ");
        vi.advanceTimersByTime(400);

        expect(queriedUrls).toContain("https://duplicate.example/item?a=1&b=2");
        expect(duplicateWarnings()).toEqual({
            0: "Existing duplicate",
        });

        dispose();
    });

    it("debounces duplicate checks independently for each link field", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "",
                description: "",
                isPrimary: false,
                isNew: true,
            },
            {
                url: "",
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
                        if (
                            urlAccessor() === "https://duplicate.example/first"
                        ) {
                            return {
                                isDuplicate: true,
                                conflictingItem: {
                                    id: "item-1",
                                    title: "First duplicate",
                                    categoryId: "cat-1",
                                },
                            };
                        }

                        if (
                            urlAccessor() === "https://duplicate.example/second"
                        ) {
                            return {
                                isDuplicate: true,
                                conflictingItem: {
                                    id: "item-2",
                                    title: "Second duplicate",
                                    categoryId: "cat-2",
                                },
                            };
                        }

                        return undefined;
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

        handleUrlChange(0, "https://duplicate.example/first");
        vi.advanceTimersByTime(200);
        handleUrlChange(1, "https://duplicate.example/second");

        vi.advanceTimersByTime(200);

        expect(duplicateWarnings()).toEqual({
            0: "First duplicate",
            1: null,
        });

        vi.advanceTimersByTime(200);

        expect(duplicateWarnings()).toEqual({
            0: "First duplicate",
            1: "Second duplicate",
        });

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

    it("reset clears pending debounce timers", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "",
                description: "",
                isPrimary: false,
                isNew: true,
            },
        ]);

        let handleUrlChange!: (index: number, url: string) => void;
        let duplicateWarnings!: () => Record<number, string | null>;
        let reset!: () => void;
        let dispose!: () => void;

        createRoot((rootDispose) => {
            dispose = rootDispose;
            mockUseCheckDuplicateUrl.mockImplementation(
                (urlAccessor: () => string) => ({
                    data: undefined,
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
            reset = hook.reset;
        });

        handleUrlChange(0, "https://example.com/item");
        reset();
        vi.advanceTimersByTime(400);

        expect(duplicateWarnings()).toEqual({
            0: null,
        });

        dispose();
    });

    it("does not include deleted links in duplicate warnings", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "https://example.com/deleted",
                description: "",
                isPrimary: true,
                isDeleted: true,
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
                        return undefined;
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

        handleUrlChange(0, "https://example.com/deleted");
        vi.advanceTimersByTime(400);

        expect(duplicateWarnings()).toEqual({});

        dispose();
    });

    it("does not check URLs shorter than 8 characters after normalization", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "",
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
                        return undefined;
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

        handleUrlChange(0, "abc");
        vi.advanceTimersByTime(400);

        expect(duplicateWarnings()).toEqual({
            0: null,
        });

        dispose();
    });

    it("does not check invalid URLs", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "",
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
                        return undefined;
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

        handleUrlChange(0, "not-a-valid-url-at-all-nope");
        vi.advanceTimersByTime(400);

        expect(duplicateWarnings()).toEqual({
            0: null,
        });

        dispose();
    });

    it("passes excludeItemId to duplicate check", () => {
        mockUseCheckDuplicateUrl.mockImplementation(
            (urlAccessor: () => string) => ({
                get data() {
                    return undefined;
                },
            }),
        );

        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "",
                description: "",
                isPrimary: false,
                isNew: true,
            },
        ]);

        let dispose!: () => void;

        createRoot((rootDispose) => {
            dispose = rootDispose;

            useDuplicateUrlCheck({
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
                excludeItemId: () => "item-42",
            });
        });

        expect(mockUseCheckDuplicateUrl).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function),
        );

        const excludeItemIdAccessor = mockUseCheckDuplicateUrl.mock.calls[0][1];
        expect(excludeItemIdAccessor()).toBe("item-42");

        dispose();
    });

    it("handles duplicate check errors gracefully", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "",
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
                        return undefined;
                    },
                    get error() {
                        if (
                            urlAccessor() ===
                            "https://example.com/valid-product-url"
                        ) {
                            return new Error("Network error");
                        }
                        return undefined;
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

        handleUrlChange(0, "https://example.com/valid-product-url");
        vi.advanceTimersByTime(400);

        expect(duplicateWarnings()[0]).toBeFalsy();

        dispose();
    });

    it("treats equivalent normalized urls as the same visible link", () => {
        const [links, setLinks] = createSignal<LinkItem[]>([
            {
                url: "https://duplicate.example/item",
                description: "",
                isPrimary: false,
                isNew: true,
            },
            {
                url: "HTTPS://duplicate.example:443/item/",
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
                        if (
                            urlAccessor() === "https://duplicate.example/item"
                        ) {
                            return {
                                isDuplicate: true,
                                conflictingItem: {
                                    id: "item-1",
                                    title: "Existing duplicate",
                                    categoryId: "cat-1",
                                },
                            };
                        }

                        return undefined;
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
