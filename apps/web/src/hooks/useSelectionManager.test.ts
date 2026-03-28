import { describe, it, expect } from "vitest";
import { createRoot } from "solid-js";
import { useSelectionManager } from "./useSelectionManager";

interface TestItem {
    id: string;
    name: string;
}

const items: TestItem[] = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
    { id: "3", name: "Item 3" },
];

function createManager(initialItems: TestItem[] = items) {
    return useSelectionManager({
        items: () => initialItems,
        getId: (item) => item.id,
    });
}

describe("useSelectionManager", () => {
    describe("initial state", () => {
        it("starts with no selected ids", () => {
            createRoot((dispose) => {
                const { selectedIds } = createManager();
                expect(selectedIds()).toEqual([]);
                dispose();
            });
        });

        it("starts with selection mode off", () => {
            createRoot((dispose) => {
                const { isSelectionMode } = createManager();
                expect(isSelectionMode()).toBe(false);
                dispose();
            });
        });

        it("starts with selectedCount of 0", () => {
            createRoot((dispose) => {
                const { selectedCount } = createManager();
                expect(selectedCount()).toBe(0);
                dispose();
            });
        });

        it("starts with allSelected false", () => {
            createRoot((dispose) => {
                const { allSelected } = createManager();
                expect(allSelected()).toBe(false);
                dispose();
            });
        });
    });

    describe("toggleSelection", () => {
        it("selects an item when not selected", () => {
            createRoot((dispose) => {
                const { toggleSelection, isSelected, selectedCount } =
                    createManager();
                toggleSelection("1");
                expect(isSelected("1")).toBe(true);
                expect(selectedCount()).toBe(1);
                dispose();
            });
        });

        it("deselects an item when already selected", () => {
            createRoot((dispose) => {
                const { toggleSelection, isSelected, selectedCount } =
                    createManager();
                toggleSelection("1");
                expect(isSelected("1")).toBe(true);
                toggleSelection("1"); // deselect
                expect(isSelected("1")).toBe(false);
                expect(selectedCount()).toBe(0);
                dispose();
            });
        });

        it("can select multiple items independently", () => {
            createRoot((dispose) => {
                const { toggleSelection, isSelected, selectedCount } =
                    createManager();
                toggleSelection("1");
                toggleSelection("3");
                expect(isSelected("1")).toBe(true);
                expect(isSelected("2")).toBe(false);
                expect(isSelected("3")).toBe(true);
                expect(selectedCount()).toBe(2);
                dispose();
            });
        });
    });

    describe("selectAll", () => {
        it("selects all items", () => {
            createRoot((dispose) => {
                const { selectAll, selectedIds, selectedCount, allSelected } =
                    createManager();
                selectAll();
                expect(selectedIds()).toHaveLength(3);
                expect(selectedCount()).toBe(3);
                expect(allSelected()).toBe(true);
                dispose();
            });
        });

        it("selects all with correct ids", () => {
            createRoot((dispose) => {
                const { selectAll, isSelected } = createManager();
                selectAll();
                expect(isSelected("1")).toBe(true);
                expect(isSelected("2")).toBe(true);
                expect(isSelected("3")).toBe(true);
                dispose();
            });
        });

        it("works with empty items list", () => {
            createRoot((dispose) => {
                const { selectAll, selectedCount } = createManager([]);
                selectAll();
                expect(selectedCount()).toBe(0);
                dispose();
            });
        });
    });

    describe("clearSelection", () => {
        it("clears all selected items", () => {
            createRoot((dispose) => {
                const { toggleSelection, clearSelection, selectedCount } =
                    createManager();
                toggleSelection("1");
                toggleSelection("2");
                expect(selectedCount()).toBe(2);
                clearSelection();
                expect(selectedCount()).toBe(0);
                dispose();
            });
        });

        it("clears after selectAll", () => {
            createRoot((dispose) => {
                const { selectAll, clearSelection, allSelected, selectedIds } =
                    createManager();
                selectAll();
                expect(allSelected()).toBe(true);
                clearSelection();
                expect(allSelected()).toBe(false);
                expect(selectedIds()).toHaveLength(0);
                dispose();
            });
        });
    });

    describe("selectedItems", () => {
        it("returns the selected item objects", () => {
            createRoot((dispose) => {
                const { toggleSelection, selectedItems } = createManager();
                toggleSelection("1");
                toggleSelection("3");
                const selected = selectedItems();
                expect(selected).toHaveLength(2);
                expect(selected.map((i) => i.id)).toContain("1");
                expect(selected.map((i) => i.id)).toContain("3");
                dispose();
            });
        });

        it("returns empty array when nothing is selected", () => {
            createRoot((dispose) => {
                const { selectedItems } = createManager();
                expect(selectedItems()).toHaveLength(0);
                dispose();
            });
        });
    });

    describe("allSelected", () => {
        it("returns false when items list is empty", () => {
            createRoot((dispose) => {
                const { allSelected } = createManager([]);
                expect(allSelected()).toBe(false);
                dispose();
            });
        });

        it("returns false when only some items are selected", () => {
            createRoot((dispose) => {
                const { toggleSelection, allSelected } = createManager();
                toggleSelection("1");
                expect(allSelected()).toBe(false);
                dispose();
            });
        });

        it("returns true when all items are selected", () => {
            createRoot((dispose) => {
                const { selectAll, allSelected } = createManager();
                selectAll();
                expect(allSelected()).toBe(true);
                dispose();
            });
        });
    });

    describe("enterSelectionMode", () => {
        it("sets isSelectionMode to true", () => {
            createRoot((dispose) => {
                const { enterSelectionMode, isSelectionMode } = createManager();
                enterSelectionMode();
                expect(isSelectionMode()).toBe(true);
                dispose();
            });
        });

        it("clears existing selection when entering selection mode", () => {
            createRoot((dispose) => {
                const { toggleSelection, enterSelectionMode, selectedCount } =
                    createManager();
                toggleSelection("1");
                toggleSelection("2");
                expect(selectedCount()).toBe(2);
                enterSelectionMode();
                expect(selectedCount()).toBe(0);
                dispose();
            });
        });
    });

    describe("exitSelectionMode", () => {
        it("sets isSelectionMode to false", () => {
            createRoot((dispose) => {
                const {
                    enterSelectionMode,
                    exitSelectionMode,
                    isSelectionMode,
                } = createManager();
                enterSelectionMode();
                expect(isSelectionMode()).toBe(true);
                exitSelectionMode();
                expect(isSelectionMode()).toBe(false);
                dispose();
            });
        });

        it("clears selection when exiting selection mode", () => {
            createRoot((dispose) => {
                const {
                    enterSelectionMode,
                    toggleSelection,
                    exitSelectionMode,
                    selectedCount,
                } = createManager();
                enterSelectionMode();
                toggleSelection("1");
                expect(selectedCount()).toBe(1);
                exitSelectionMode();
                expect(selectedCount()).toBe(0);
                dispose();
            });
        });
    });

    describe("setIsSelectionMode", () => {
        it("can set selection mode directly", () => {
            createRoot((dispose) => {
                const { setIsSelectionMode, isSelectionMode } = createManager();
                setIsSelectionMode(true);
                expect(isSelectionMode()).toBe(true);
                setIsSelectionMode(false);
                expect(isSelectionMode()).toBe(false);
                dispose();
            });
        });
    });

    describe("getSelectedIds", () => {
        it("returns selected ids as array", () => {
            createRoot((dispose) => {
                const { toggleSelection, selectedIds } = createManager();
                toggleSelection("2");
                toggleSelection("3");
                const ids = selectedIds();
                expect(ids).toHaveLength(2);
                expect(ids).toContain("2");
                expect(ids).toContain("3");
                dispose();
            });
        });
    });
});
