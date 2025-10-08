import {
  type JSX,
  createContext,
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
}

const WishlistDataContext = createContext<WishlistDataContextValue>();

export function WishlistDataProvider(props: { children: JSX.Element }) {
  const [trigger] = createSignal(true);

  const [data, { refetch, mutate }] = createResource(trigger, async () =>
    wishlistApi.getWishlist(),
  );

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
