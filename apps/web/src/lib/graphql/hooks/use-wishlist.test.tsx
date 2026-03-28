import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { createSignal } from "solid-js";
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
};

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function Wrapper(props: { children: unknown; client?: QueryClient }) {
  const client = props.client ?? createTestClient();
  return (
    <QueryClientProvider client={client}>
      {props.children as any}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

const mockCategory = {
  id: "cat-1",
  name: "Electronics",
  description: "",
  position: 0,
  createdAt: "",
  updatedAt: "",
};
const mockItem = {
  id: "item-1",
  title: "Laptop",
  description: "",
  price: 999,
  currency: "USD",
  priority: 1,
  position: 0,
  isPurchased: false,
  categoryId: "cat-1",
  links: [],
  createdAt: "",
  updatedAt: "",
};
const mockLink = {
  id: "link-1",
  url: "https://example.com",
  description: "",
  isPrimary: true,
  itemId: "item-1",
  createdAt: "",
  updatedAt: "",
};

describe("useWishlist", () => {
  it("fetches wishlist data", async () => {
    const mockWishlist = {
      items: [mockItem],
      categories: [mockCategory],
      pagination: null,
    };
    mocks.getWishlist.mockResolvedValueOnce(mockWishlist as any);

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
    mocks.getWishlist.mockResolvedValueOnce({
      items: [],
      categories: [],
      pagination: null,
    } as any);

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
    mocks.getItem.mockResolvedValueOnce(mockItem as any);

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
    mocks.createCategory.mockResolvedValueOnce(mockCategory as any);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useCreateCategory();
      return (
        <div>
          <button
            onClick={() => mutation.mutate({ name: "Books", description: "" })}
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
    expect(invalidateSpy).toHaveBeenCalled();
  });
});

describe("useUpdateCategory", () => {
  it("updates category and invalidates queries on success", async () => {
    mocks.updateCategory.mockResolvedValueOnce(mockCategory as any);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useUpdateCategory();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({ id: "cat-1", input: { name: "Updated" } })
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
    mocks.createItem.mockResolvedValueOnce(mockItem as any);
    const client = createTestClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    function Component() {
      const mutation = useCreateItem();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({ title: "Laptop", categoryId: "cat-1" })
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
    mocks.updateItem.mockResolvedValueOnce(mockItem as any);
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
    mocks.addItemLink.mockResolvedValueOnce(mockLink as any);
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
                input: { url: "https://example.com", isPrimary: false },
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
    mocks.updateItemLink.mockResolvedValueOnce(mockLink as any);
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
              mutation.mutate({ itemId: "item-1", linkId: "link-1" })
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
