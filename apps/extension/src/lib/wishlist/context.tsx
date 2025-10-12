import {
  type JSX,
  createContext,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  useContext,
  type Resource,
  type ResourceActions,
} from "solid-js";
import type { WishlistData } from "@repo/common/types/wishlist";
import { wishlistApi } from "../api/wishlist.js";

interface WishlistDataContextValue {
  data: Resource<WishlistData | undefined>;
  refetch: ResourceActions<WishlistData | undefined>["refetch"];
  mutate: ResourceActions<WishlistData | undefined>["mutate"];
  api: typeof wishlistApi;
  value: () => WishlistData | undefined;
  state: () => Resource<WishlistData | undefined>["state"];
  error: () => unknown;
  page: () => number;
  setPage: (page: number) => void;
  pageSize: number;
  categoryId: () => string | null;
  setCategoryId: (categoryId: string | null) => void;
}

const WishlistDataContext = createContext<WishlistDataContextValue>();

export function WishlistDataProvider(props: { children: JSX.Element }) {
  const PAGE_SIZE = 5;
  const [page, setPage] = createSignal(1);
  const [categoryId, setCategoryId] = createSignal<string | null>(null);

  const [data, { refetch, mutate }] = createResource(
    () => ({ page: page(), categoryId: categoryId() }),
    async ({ page: currentPage, categoryId: categoryFilter }) => {
      const result = await wishlistApi.getWishlist({
        page: currentPage,
        pageSize: PAGE_SIZE,
        categoryId: categoryFilter ?? undefined,
      });

      const normalizedPage =
        result.pagination.page && result.pagination.page > 0
          ? result.pagination.page
          : currentPage;

      if (normalizedPage !== currentPage) {
        queueMicrotask(() => {
          setPage(normalizedPage);
        });
      }

      return result;
    },
  );

  createEffect(() => {
    categoryId();
    if (page() !== 1) {
      setPage(1);
    }
  });

  const valueAccessor = createMemo(() => {
    const state = data.state;
    if (state === "ready" || state === "refreshing") {
      return data() ?? undefined;
    }
    return undefined;
  });

  const value: WishlistDataContextValue = {
    data,
    refetch,
    mutate,
    api: wishlistApi,
    value: valueAccessor,
    state: () => data.state,
    error: () => data.error,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    categoryId,
    setCategoryId,
  };

  return (
    <WishlistDataContext.Provider value={value}>
      {props.children}
    </WishlistDataContext.Provider>
  );
}

export function useWishlistData(): WishlistDataContextValue {
  const context = useContext(WishlistDataContext);
  if (!context) {
    throw new Error(
      "useWishlistData must be used within a WishlistDataProvider",
    );
  }
  return context;
}
