import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@solidjs/testing-library";
import { WishlistDataProvider, useWishlistData } from "../../../src/lib/wishlist/context";

vi.mock("../../../src/lib/graphql/wishlist", () => ({
  getWishlist: vi.fn().mockResolvedValue({
    items: [],
    categories: [],
    pagination: { total: 0, page: 1, pageSize: 5, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
  }),
  getCategories: vi.fn(),
  getItem: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  addItemLink: vi.fn(),
  updateItemLink: vi.fn(),
  deleteItemLink: vi.fn(),
  setPrimaryLink: vi.fn(),
}));

import * as wishlistGraphQL from "../../../src/lib/graphql/wishlist";

afterEach(() => {
  cleanup();
});

describe("WishlistDataProvider", () => {
  it("renders children", () => {
    render(() => (
      <WishlistDataProvider>
        <div data-testid="child">Hello</div>
      </WishlistDataProvider>
    ));

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("exposes pageSize of 5", () => {
    let pageSize: number | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      pageSize = ctx.pageSize;
      return <div />;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(pageSize).toBe(5);
  });

  it("starts on page 1", () => {
    let page: number | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      page = ctx.page();
      return <div />;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(page).toBe(1);
  });

  it("starts with null categoryId", () => {
    let categoryId: string | null = undefined as unknown as string | null;

    function Consumer() {
      const ctx = useWishlistData();
      categoryId = ctx.categoryId();
      return <div />;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(categoryId).toBeNull();
  });

  it("exposes setPage function", () => {
    let setPageFn: ((p: number) => void) | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      setPageFn = ctx.setPage;
      return <div />;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(typeof setPageFn).toBe("function");
  });

  it("exposes setCategoryId function", () => {
    let setCategoryIdFn: ((id: string | null) => void) | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      setCategoryIdFn = ctx.setCategoryId;
      return <div />;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(typeof setCategoryIdFn).toBe("function");
  });

  it("exposes refetch function", () => {
    let refetchFn: (() => void) | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      refetchFn = ctx.refetch as () => void;
      return <div />;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(typeof refetchFn).toBe("function");
  });

  it("exposes api module with wishlist operations", () => {
    let apiRef: typeof wishlistGraphQL | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      apiRef = ctx.api;
      return <div />;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(apiRef).toBeDefined();
    expect(typeof apiRef!.getWishlist).toBe("function");
    expect(typeof apiRef!.createItem).toBe("function");
    expect(typeof apiRef!.deleteItem).toBe("function");
    expect(typeof apiRef!.createCategory).toBe("function");
  });

  it("updates categoryId when setCategoryId is called", () => {
    let setCategoryIdFn: ((id: string | null) => void) | null = null;
    let categoryId: string | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      setCategoryIdFn = ctx.setCategoryId;
      categoryId = ctx.categoryId();
      return <span data-testid="cat">{ctx.categoryId() ?? "null"}</span>;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(screen.getByTestId("cat").textContent).toBe("null");

    setCategoryIdFn!("cat-1");

    expect(screen.getByTestId("cat").textContent).toBe("cat-1");
  });

  it("updates page when setPage is called", () => {
    let setPageFn: ((p: number) => void) | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      setPageFn = ctx.setPage;
      return <span data-testid="page">{ctx.page()}</span>;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    expect(screen.getByTestId("page").textContent).toBe("1");

    setPageFn!(3);

    expect(screen.getByTestId("page").textContent).toBe("3");
  });

  it("resets page to 1 when categoryId changes", () => {
    let setPageFn: ((p: number) => void) | null = null;
    let setCategoryIdFn: ((id: string | null) => void) | null = null;

    function Consumer() {
      const ctx = useWishlistData();
      setPageFn = ctx.setPage;
      setCategoryIdFn = ctx.setCategoryId;
      return <span data-testid="page">{ctx.page()}</span>;
    }

    render(() => (
      <WishlistDataProvider>
        <Consumer />
      </WishlistDataProvider>
    ));

    // Go to page 3
    setPageFn!(3);
    expect(screen.getByTestId("page").textContent).toBe("3");

    // Changing category resets page to 1
    setCategoryIdFn!("cat-1");
    expect(screen.getByTestId("page").textContent).toBe("1");
  });
});

describe("useWishlistData", () => {
  it("throws when used outside of WishlistDataProvider", () => {
    function ConsumerWithoutProvider() {
      useWishlistData();
      return <div />;
    }

    expect(() => {
      render(() => <ConsumerWithoutProvider />);
    }).toThrow("useWishlistData must be used within a WishlistDataProvider");
  });
});
