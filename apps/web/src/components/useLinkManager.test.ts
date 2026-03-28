import { describe, it, expect, vi } from "vitest";
import { createRoot } from "solid-js";
import { useLinkManager, type LinkItem } from "./useLinkManager";

/** Runs a test callback inside a SolidJS root and always disposes it. */
function withRoot<T>(fn: () => T): T {
    let result!: T;
    createRoot((dispose) => {
        try {
            result = fn();
        } finally {
            dispose();
        }
    });
    return result;
}

describe("useLinkManager", () => {
    it("initializes with empty links by default", () => {
        withRoot(() => {
            const { links } = useLinkManager();
            expect(links()).toEqual([]);
        });
    });

    it("initializes with provided initial links", () => {
        const initialLinks: LinkItem[] = [
            {
                id: "1",
                url: "https://example.com",
                description: "Example",
                isPrimary: true,
            },
        ];
        withRoot(() => {
            const { links } = useLinkManager(initialLinks);
            expect(links()).toEqual(initialLinks);
        });
    });

    describe("addLink", () => {
        it("adds a new empty link", () => {
            withRoot(() => {
                const { links, addLink } = useLinkManager();
                addLink();
                expect(links()).toHaveLength(1);
                expect(links()[0]).toEqual({
                    url: "",
                    description: "",
                    isPrimary: false,
                    isNew: true,
                });
            });
        });

        it("appends new link to existing links", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://existing.com",
                    description: "Existing",
                    isPrimary: true,
                },
            ];
            withRoot(() => {
                const { links, addLink } = useLinkManager(initialLinks);
                addLink();
                expect(links()).toHaveLength(2);
                expect(links()[1]).toMatchObject({ url: "", isNew: true });
            });
        });

        it("can add multiple links", () => {
            withRoot(() => {
                const { links, addLink } = useLinkManager();
                addLink();
                addLink();
                addLink();
                expect(links()).toHaveLength(3);
            });
        });
    });

    describe("removeLink", () => {
        it("removes a new link entirely", () => {
            withRoot(() => {
                const { links, addLink, removeLink } = useLinkManager();
                addLink();
                expect(links()).toHaveLength(1);
                removeLink(0);
                expect(links()).toHaveLength(0);
            });
        });

        it("marks existing link as deleted instead of removing it", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://example.com",
                    description: "Example",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, removeLink } = useLinkManager(initialLinks);
                removeLink(0);
                expect(links()).toHaveLength(1);
                expect(links()[0]!.isDeleted).toBe(true);
            });
        });

        it("calls onRemoveExisting callback when removing existing link", () => {
            const onRemoveExisting = vi.fn();
            const link: LinkItem = {
                id: "1",
                url: "https://example.com",
                description: "Ex",
                isPrimary: false,
            };
            withRoot(() => {
                const { removeLink } = useLinkManager([link], {
                    onRemoveExisting,
                });
                removeLink(0);
                expect(onRemoveExisting).toHaveBeenCalledWith(0, link);
            });
        });

        it("does not call onRemoveExisting when removing new link", () => {
            const onRemoveExisting = vi.fn();
            withRoot(() => {
                const { addLink, removeLink } = useLinkManager([], {
                    onRemoveExisting,
                });
                addLink();
                removeLink(0);
                expect(onRemoveExisting).not.toHaveBeenCalled();
            });
        });

        it("does nothing when index is out of bounds", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://example.com",
                    description: "Example",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, removeLink } = useLinkManager(initialLinks);
                removeLink(99);
                expect(links()).toHaveLength(1);
                expect(links()[0]!.isDeleted).toBeUndefined();
            });
        });

        it("only marks the specific index as deleted, not others", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://a.com",
                    description: "A",
                    isPrimary: false,
                },
                {
                    id: "2",
                    url: "https://b.com",
                    description: "B",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, removeLink } = useLinkManager(initialLinks);
                removeLink(0);
                expect(links()[0]!.isDeleted).toBe(true);
                expect(links()[1]!.isDeleted).toBeUndefined();
            });
        });
    });

    describe("removeAllLinks", () => {
        it("marks all existing links as deleted", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://a.com",
                    description: "A",
                    isPrimary: false,
                },
                {
                    id: "2",
                    url: "https://b.com",
                    description: "B",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, removeAllLinks } = useLinkManager(initialLinks);
                removeAllLinks();
                expect(links()).toHaveLength(2);
                expect(links()[0]!.isDeleted).toBe(true);
                expect(links()[1]!.isDeleted).toBe(true);
            });
        });

        it("removes new links entirely when removeAllLinks is called", () => {
            withRoot(() => {
                const { links, addLink, removeAllLinks } = useLinkManager();
                addLink();
                addLink();
                expect(links()).toHaveLength(2);
                removeAllLinks();
                expect(links()).toHaveLength(0);
            });
        });

        it("handles mixed new and existing links correctly", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://a.com",
                    description: "A",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, addLink, removeAllLinks } =
                    useLinkManager(initialLinks);
                addLink(); // adds a new link
                expect(links()).toHaveLength(2);
                removeAllLinks();
                // new link is removed, existing link is marked deleted
                expect(links()).toHaveLength(1);
                expect(links()[0]!.isDeleted).toBe(true);
                expect(links()[0]!.id).toBe("1");
            });
        });

        it("does nothing when there are no links", () => {
            withRoot(() => {
                const { links, removeAllLinks } = useLinkManager();
                removeAllLinks();
                expect(links()).toHaveLength(0);
            });
        });
    });

    describe("updateLink", () => {
        it("updates the url of a link at a given index", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://old.com",
                    description: "Old",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, updateLink } = useLinkManager(initialLinks);
                updateLink(0, "url", "https://new.com");
                expect(links()[0]!.url).toBe("https://new.com");
            });
        });

        it("updates the description of a link", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://example.com",
                    description: "Old desc",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, updateLink } = useLinkManager(initialLinks);
                updateLink(0, "description", "New desc");
                expect(links()[0]!.description).toBe("New desc");
            });
        });

        it("updates isPrimary of a link", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://example.com",
                    description: "Desc",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, updateLink } = useLinkManager(initialLinks);
                updateLink(0, "isPrimary", true);
                expect(links()[0]!.isPrimary).toBe(true);
            });
        });

        it("only updates the specified link, leaving others unchanged", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://a.com",
                    description: "A",
                    isPrimary: false,
                },
                {
                    id: "2",
                    url: "https://b.com",
                    description: "B",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, updateLink } = useLinkManager(initialLinks);
                updateLink(0, "url", "https://updated.com");
                expect(links()[0]!.url).toBe("https://updated.com");
                expect(links()[1]!.url).toBe("https://b.com");
            });
        });
    });

    describe("resetLinks", () => {
        it("replaces all links with new links", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://old.com",
                    description: "Old",
                    isPrimary: false,
                },
            ];
            const newLinks: LinkItem[] = [
                {
                    id: "2",
                    url: "https://new.com",
                    description: "New",
                    isPrimary: true,
                },
                {
                    id: "3",
                    url: "https://another.com",
                    description: "Another",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, resetLinks } = useLinkManager(initialLinks);
                resetLinks(newLinks);
                expect(links()).toEqual(newLinks);
            });
        });

        it("resets to empty array when called with no arguments", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://example.com",
                    description: "Example",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, resetLinks } = useLinkManager(initialLinks);
                resetLinks();
                expect(links()).toEqual([]);
            });
        });

        it("resets to empty array when called with empty array", () => {
            const initialLinks: LinkItem[] = [
                {
                    id: "1",
                    url: "https://example.com",
                    description: "Example",
                    isPrimary: false,
                },
            ];
            withRoot(() => {
                const { links, resetLinks } = useLinkManager(initialLinks);
                resetLinks([]);
                expect(links()).toEqual([]);
            });
        });
    });
});
