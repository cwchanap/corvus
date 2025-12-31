import { createSignal, createMemo, type Accessor } from "solid-js";

export interface SelectionManagerOptions<T> {
    items: Accessor<T[]>;
    getId: (item: T) => string;
}

export function useSelectionManager<T>({
    items,
    getId,
}: SelectionManagerOptions<T>) {
    const [selectedIds, setSelectedIds] = createSignal<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = createSignal(false);

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAll = () => {
        const allIds = items().map(getId);
        setSelectedIds(new Set(allIds));
    };

    const clearSelection = () => {
        setSelectedIds(new Set<string>());
    };

    const isSelected = (id: string) => {
        return selectedIds().has(id);
    };

    const selectedCount = createMemo(() => selectedIds().size);

    const selectedItems = createMemo(() => {
        const ids = selectedIds();
        return items().filter((item) => ids.has(getId(item)));
    });

    const allSelected = createMemo(() => {
        const itemsList = items();
        if (itemsList.length === 0) return false;
        return itemsList.every((item) => selectedIds().has(getId(item)));
    });

    const enterSelectionMode = () => {
        setIsSelectionMode(true);
        clearSelection();
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        clearSelection();
    };

    const getSelectedIds = (): string[] => {
        return Array.from(selectedIds());
    };

    return {
        // State
        selectedIds: getSelectedIds,
        isSelectionMode,
        selectedCount,
        selectedItems,
        allSelected,

        // Actions
        toggleSelection,
        selectAll,
        clearSelection,
        isSelected,
        enterSelectionMode,
        exitSelectionMode,
        setIsSelectionMode,
    };
}
