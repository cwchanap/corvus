/**
 * TanStack Query hooks for wishlist operations
 */

import {
    createQuery,
    createMutation,
    useQueryClient,
} from "@tanstack/solid-query";
import {
    getWishlist,
    getCategories,
    getItem,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    addItemLink,
    updateItemLink,
    deleteItemLink,
    setPrimaryLink,
} from "../wishlist.ts";
import type { Accessor } from "solid-js";
import type {
    WishlistFilterInput,
    PaginationInput,
    CategoryUpdateInput,
    ItemUpdateInput,
    ItemLinkInput,
    ItemLinkUpdateInput,
} from "../wishlist.ts";

/**
 * Query hook to get wishlist data with pagination and filtering
 */
export function useWishlist(
    filter?: Accessor<WishlistFilterInput | undefined>,
    pagination?: Accessor<PaginationInput | undefined>,
) {
    return createQuery(() => ({
        queryKey: ["wishlist", filter?.(), pagination?.()],
        queryFn: () => getWishlist(filter?.(), pagination?.()),
        placeholderData: (previous) => previous,
        suspense: false,
    }));
}

/**
 * Query hook to get all categories
 */
export function useCategories() {
    return createQuery(() => ({
        queryKey: ["wishlist", "categories"],
        queryFn: getCategories,
    }));
}

/**
 * Query hook to get a specific item by ID
 */
export function useItem(id: Accessor<string>) {
    return createQuery(() => ({
        queryKey: ["wishlist", "item", id()],
        queryFn: () => getItem(id()),
        enabled: !!id(),
    }));
}

// Category mutations
export function useCreateCategory() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: createCategory,
        onSuccess: () => {
            // Invalidate categories and wishlist queries
            queryClient.invalidateQueries({
                queryKey: ["wishlist", "categories"],
            });
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    }));
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: ({
            id,
            input,
        }: {
            id: string;
            input: CategoryUpdateInput;
        }) => updateCategory(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wishlist", "categories"],
            });
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    }));
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wishlist", "categories"],
            });
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    }));
}

// Item mutations
export function useCreateItem() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    }));
}

export function useUpdateItem() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: ({ id, input }: { id: string; input: ItemUpdateInput }) =>
            updateItem(id, input),
        onSuccess: (
            _: unknown,
            variables: { id: string; input: ItemUpdateInput },
        ) => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            queryClient.invalidateQueries({
                queryKey: ["wishlist", "item", variables.id],
            });
        },
    }));
}

export function useDeleteItem() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: deleteItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    }));
}

// Link mutations
export function useAddItemLink() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: ({
            itemId,
            input,
        }: {
            itemId: string;
            input: ItemLinkInput;
        }) => addItemLink(itemId, input),
        onSuccess: (
            _: unknown,
            variables: { itemId: string; input: ItemLinkInput },
        ) => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            queryClient.invalidateQueries({
                queryKey: ["wishlist", "item", variables.itemId],
            });
        },
    }));
}

export function useUpdateItemLink() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: ({
            id,
            input,
        }: {
            id: string;
            input: ItemLinkUpdateInput;
        }) => updateItemLink(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    }));
}

export function useDeleteItemLink() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: deleteItemLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    }));
}

export function useSetPrimaryLink() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: ({ itemId, linkId }: { itemId: string; linkId: string }) =>
            setPrimaryLink(itemId, linkId),
        onSuccess: (
            _: unknown,
            variables: { itemId: string; linkId: string },
        ) => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            queryClient.invalidateQueries({
                queryKey: ["wishlist", "item", variables.itemId],
            });
        },
    }));
}
