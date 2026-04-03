import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { JSX } from "solid-js";
import { createSignal } from "solid-js";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import type {
  WishlistPayload,
  WishlistCategory,
  WishlistItem,
  WishlistItemLink,
} from "../wishlist";
import {
  useWishlist,
  useCategories,
  useItem,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useAddItemLink,
  useUpdateItemLink,
  useDeleteItemLink,
  useSetPrimaryLink,
  useBatchDeleteItems,
  useBatchMoveItems,
  useCheckDuplicateUrl,
  useRecentItems,
} from "./use-wishlist";

// Mock wishlist operations
vi.mock("../wishlist", () => ({
  getWishlist: vi.fn(),
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
  batchDeleteItems: vi.fn(),
  batchMoveItems: vi.fn(),
  checkDuplicateUrl: vi.fn(),
  getRecentItems: vi.fn(),
}));

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
  batchDeleteItems,
  batchMoveItems,
  checkDuplicateUrl,
  getRecentItems,
} from "../wishlist";

const mocks = {
  getWishlist: vi.mocked(getWishlist),
  getCategories: vi.mocked(getCategories),
  getItem: vi.mocked(getItem),
  createCategory: vi.mocked(createCategory),
  updateCategory: vi.mocked(updateCategory),
  deleteCategory: vi.mocked(deleteCategory),
  createItem: vi.mocked(createItem),
  updateItem: vi.mocked(updateItem),
  deleteItem: vi.mocked(deleteItem),
  addItemLink: vi.mocked(addItemLink),
  updateItemLink: vi.mocked(updateItemLink),
  deleteItemLink: vi.mocked(deleteItemLink),
  setPrimaryLink: vi.mocked(setPrimaryLink),
  batchDeleteItems: vi.mocked(batchDeleteItems),
  batchMoveItems: vi.mocked(batchMoveItems),
  checkDuplicateUrl: vi.mocked(checkDuplicateUrl),
  getRecentItems: vi.mocked(getRecentItems),
};

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function Wrapper(props: { children: JSX.Element; client?: QueryClient }) {
  return (
    <QueryClientProvider client={props.client ?? createTestClient()}>
      {props.children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

const mockCategory: WishlistCategory = {
  id: "cat-1",
  name: "Electronics",
  color: null,
  userId: "user-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

const mockItem: WishlistItem = {
  id: "item-1",
  title: "Laptop",
  description: null,
  categoryId: "cat-1",
  favicon: null,
  userId: "user-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
  links: [],
};

const mockLink: WishlistItemLink = {
  id: "link-1",
  url: "https://example.com",
  description: null,
  isPrimary: true,
  itemId: "item-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

const mockWishlist: WishlistPayload = {
  items: [mockItem],
  categories: [mockCategory],
  pagination: {
    totalItems: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
};

describe("useWishlist", () => {
  it("fetches wishlist data", async () => {
    mocks.getWishlist.mockResolvedValueOnce(mockWishlist);

    function Component() {
      const query = useWishlist();
      return (
        <div>
          {query.isLoading
            ? "loading"
            : `items: ${query.data?.items?.length ?? 0}`}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() =>
      expect(screen.getByText("items: 1")).toBeInTheDocument(),
    );
  });

  it("passes filter and pagination to getWishlist", async () => {
    mocks.getWishlist.mockResolvedValueOnce(mockWishlist);

    function Component() {
      const [filter] = createSignal({ search: "laptop" });
      const [pagination] = createSignal({ page: 1, pageSize: 10 });
      const query = useWishlist(filter, pagination);
      return <div>{query.isLoading ? "loading" : "done"}</div>;
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() => expect(screen.getByText("done")).toBeInTheDocument());
    expect(mocks.getWishlist).toHaveBeenCalledWith(
      { search: "laptop" },
      { page: 1, pageSize: 10 },
    );
  });
});

describe("useCategories", () => {
  it("fetches categories", async () => {
    mocks.getCategories.mockResolvedValueOnce([mockCategory]);

    function Component() {
      const query = useCategories();
      return (
        <div>
          {query.isLoading ? "loading" : `cats: ${query.data?.length ?? 0}`}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() =>
      expect(screen.getByText("cats: 1")).toBeInTheDocument(),
    );
  });
});

describe("useItem", () => {
  it("fetches item by id", async () => {
    mocks.getItem.mockResolvedValueOnce(mockItem);

    function Component() {
      const [id] = createSignal("item-1");
      const query = useItem(id);
      return (
        <div>
          {query.isLoading ? "loading" : (query.data?.title ?? "no item")}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() => expect(screen.getByText("Laptop")).toBeInTheDocument());
    expect(mocks.getItem).toHaveBeenCalledWith("item-1");
  });
});

describe("useCreateCategory", () => {
  it("creates category and invalidates queries on success", async () => {
    mocks.createCategory.mockResolvedValueOnce(mockCategory);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const categoryInput = { name: "Books", description: "" };

    function Component() {
      const mutation = useCreateCategory();
      return (
        <div>
          <button onClick={() => mutation.mutate(categoryInput)}>Create</button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Create").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(mocks.createCategory).toHaveBeenCalledWith(
      categoryInput,
      expect.anything(),
    );
    expect(invalidateSpy).toHaveBeenCalled();
  });
});

describe("useUpdateCategory", () => {
  it("updates category and invalidates queries on success", async () => {
    mocks.updateCategory.mockResolvedValueOnce(mockCategory);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useUpdateCategory();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                id: "cat-1",
                input: { name: "Updated" },
              })
            }
          >
            Update
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Update").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalled();
  });
});

describe("useDeleteCategory", () => {
  it("deletes category and invalidates queries on success", async () => {
    mocks.deleteCategory.mockResolvedValueOnce(true);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useDeleteCategory();
      return (
        <div>
          <button onClick={() => mutation.mutate("cat-1")}>Delete</button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Delete").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalled();
  });
});

describe("useCreateItem", () => {
  it("creates item and invalidates wishlist query on success", async () => {
    mocks.createItem.mockResolvedValueOnce(mockItem);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useCreateItem();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                title: "Laptop",
                categoryId: "cat-1",
              })
            }
          >
            Create
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Create").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
  });
});

describe("useUpdateItem", () => {
  it("updates item and invalidates relevant queries on success", async () => {
    mocks.updateItem.mockResolvedValueOnce(mockItem);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useUpdateItem();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                id: "item-1",
                input: { title: "Updated Laptop" },
              })
            }
          >
            Update
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Update").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["wishlist", "item", "item-1"],
    });
  });
});

describe("useDeleteItem", () => {
  it("deletes item and invalidates wishlist query on success", async () => {
    mocks.deleteItem.mockResolvedValueOnce(true);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useDeleteItem();
      return (
        <div>
          <button onClick={() => mutation.mutate("item-1")}>Delete</button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Delete").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
  });
});

describe("useAddItemLink", () => {
  it("adds item link and invalidates relevant queries on success", async () => {
    mocks.addItemLink.mockResolvedValueOnce(mockLink);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useAddItemLink();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                itemId: "item-1",
                input: {
                  url: "https://example.com",
                  isPrimary: false,
                },
              })
            }
          >
            Add
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Add").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["wishlist", "item", "item-1"],
    });
  });
});

describe("useUpdateItemLink", () => {
  it("updates item link and invalidates wishlist query on success", async () => {
    mocks.updateItemLink.mockResolvedValueOnce(mockLink);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useUpdateItemLink();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                id: "link-1",
                input: { url: "https://updated.com" },
              })
            }
          >
            Update
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Update").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
  });
});

describe("useDeleteItemLink", () => {
  it("deletes item link and invalidates wishlist query on success", async () => {
    mocks.deleteItemLink.mockResolvedValueOnce(true);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useDeleteItemLink();
      return (
        <div>
          <button onClick={() => mutation.mutate("link-1")}>Delete</button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Delete").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
  });
});

describe("useSetPrimaryLink", () => {
  it("sets primary link and invalidates relevant queries on success", async () => {
    mocks.setPrimaryLink.mockResolvedValueOnce(true);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useSetPrimaryLink();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                itemId: "item-1",
                linkId: "link-1",
              })
            }
          >
            Set Primary
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Set Primary").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["wishlist", "item", "item-1"],
    });
  });
});

describe("useBatchDeleteItems", () => {
  it("batch deletes items and invalidates wishlist query on success", async () => {
    mocks.batchDeleteItems.mockResolvedValueOnce({
      successCount: 2,
      failedIds: [],
    });
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useBatchDeleteItems();
      return (
        <div>
          <button onClick={() => mutation.mutate(["item-1", "item-2"])}>
            Delete All
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Delete All").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
  });
});

describe("useBatchMoveItems", () => {
  it("batch moves items and invalidates wishlist query on success", async () => {
    mocks.batchMoveItems.mockResolvedValueOnce({
      successCount: 2,
      failedIds: [],
    });
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useBatchMoveItems();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                itemIds: ["item-1", "item-2"],
                categoryId: "cat-2",
              })
            }
          >
            Move
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={client}>
        <Component />
      </Wrapper>
    ));
    screen.getByText("Move").click();

    await waitFor(() =>
      expect(screen.getByText("success")).toBeInTheDocument(),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
  });
});

describe("useCheckDuplicateUrl", () => {
  it("fetches duplicate check result", async () => {
    mocks.checkDuplicateUrl.mockResolvedValueOnce({
      isDuplicate: true,
      conflictingItem: {
        id: "item-42",
        title: "Existing",
        categoryId: "cat-1",
      },
    });

    function Component() {
      const [url] = createSignal("https://example.com/product");
      const query = useCheckDuplicateUrl(url);
      return (
        <div>
          {query.isLoading
            ? "loading"
            : query.data?.isDuplicate
              ? "duplicate"
              : "unique"}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() =>
      expect(screen.getByText("duplicate")).toBeInTheDocument(),
    );
    expect(mocks.checkDuplicateUrl).toHaveBeenCalledWith(
      "https://example.com/product",
      undefined,
    );
  });

  it("passes excludeItemId when provided", async () => {
    mocks.checkDuplicateUrl.mockResolvedValueOnce({
      isDuplicate: false,
      conflictingItem: null,
    });

    function Component() {
      const [url] = createSignal("https://example.com/product");
      const [excludeId] = createSignal("item-1");
      const query = useCheckDuplicateUrl(url, excludeId);
      return (
        <div>
          {query.isLoading
            ? "loading"
            : query.data?.isDuplicate
              ? "dup"
              : "unique"}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() => expect(screen.getByText("unique")).toBeInTheDocument());
    expect(mocks.checkDuplicateUrl).toHaveBeenCalledWith(
      "https://example.com/product",
      "item-1",
    );
  });

  it("is disabled for short URLs", async () => {
    function Component() {
      const [url] = createSignal("");
      const query = useCheckDuplicateUrl(url);
      return (
        <div>
          {query.fetchStatus === "idle" && !query.data ? "disabled" : "active"}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    expect(screen.getByText("disabled")).toBeInTheDocument();
    expect(mocks.checkDuplicateUrl).not.toHaveBeenCalled();
  });

  it("is disabled for invalid URLs", async () => {
    function Component() {
      const [url] = createSignal("not-a-valid-url-at-all");
      const query = useCheckDuplicateUrl(url);
      return (
        <div>
          {query.fetchStatus === "idle" && !query.data ? "disabled" : "active"}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    expect(screen.getByText("disabled")).toBeInTheDocument();
    expect(mocks.checkDuplicateUrl).not.toHaveBeenCalled();
  });
});

describe("useRecentItems", () => {
  it("fetches recent items", async () => {
    mocks.getRecentItems.mockResolvedValueOnce([mockItem]);

    function Component() {
      const query = useRecentItems();
      return (
        <div>
          {query.isLoading ? "loading" : `items: ${query.data?.length ?? 0}`}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() =>
      expect(screen.getByText("items: 1")).toBeInTheDocument(),
    );
    expect(mocks.getRecentItems).toHaveBeenCalledWith(undefined);
  });

  it("passes limit accessor to getRecentItems", async () => {
    mocks.getRecentItems.mockResolvedValueOnce([]);

    function Component() {
      const [limit] = createSignal(10);
      const query = useRecentItems(limit);
      return <div>{query.isLoading ? "loading" : "done"}</div>;
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() => expect(screen.getByText("done")).toBeInTheDocument());
    expect(mocks.getRecentItems).toHaveBeenCalledWith(10);
  });
});
