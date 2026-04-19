import { describe, it, expect, vi, beforeEach } from "vitest";
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
} from "../../../src/lib/graphql/wishlist";
import * as extClient from "../../../src/lib/graphql/client";
import {
  WISHLIST_QUERY,
  CATEGORIES_QUERY,
  ITEM_QUERY,
  CREATE_CATEGORY_MUTATION,
  UPDATE_CATEGORY_MUTATION,
  DELETE_CATEGORY_MUTATION,
  CREATE_ITEM_MUTATION,
  UPDATE_ITEM_MUTATION,
  DELETE_ITEM_MUTATION,
  ADD_ITEM_LINK_MUTATION,
  UPDATE_ITEM_LINK_MUTATION,
  DELETE_ITEM_LINK_MUTATION,
  SET_PRIMARY_LINK_MUTATION,
} from "@repo/common/graphql/operations/wishlist";

vi.mock("../../../src/lib/graphql/client", () => ({
  graphqlRequest: vi.fn(),
}));

const mockedRequest = vi.mocked(extClient.graphqlRequest);

const mockCategory = {
  id: "cat-1",
  name: "Electronics",
  description: "Electronic items",
  position: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

const mockItem = {
  id: "item-1",
  title: "Laptop",
  description: "A laptop",
  price: 999.99,
  currency: "USD",
  priority: 1,
  position: 0,
  isPurchased: false,
  categoryId: "cat-1",
  links: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

const mockLink = {
  id: "link-1",
  url: "https://example.com",
  description: "Product page",
  isPrimary: true,
  itemId: "item-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

const mockPagination = {
  total: 1,
  page: 1,
  pageSize: 5,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

beforeEach(() => vi.clearAllMocks());

describe("getWishlist", () => {
  it("returns wishlist data without arguments", async () => {
    const mockWishlist = { items: [mockItem], categories: [mockCategory], pagination: mockPagination };
    mockedRequest.mockResolvedValueOnce({ wishlist: mockWishlist });

    const result = await getWishlist();

    expect(result).toEqual(mockWishlist);
    expect(mockedRequest).toHaveBeenCalledWith(WISHLIST_QUERY, { filter: undefined, pagination: undefined });
  });

  it("passes filter and pagination arguments", async () => {
    const mockWishlist = { items: [], categories: [], pagination: mockPagination };
    mockedRequest.mockResolvedValueOnce({ wishlist: mockWishlist });

    const filter = { categoryId: "cat-1" };
    const pagination = { page: 2, pageSize: 5 };
    await getWishlist(filter, pagination);

    expect(mockedRequest).toHaveBeenCalledWith(WISHLIST_QUERY, { filter, pagination });
  });

  it("propagates errors", async () => {
    mockedRequest.mockRejectedValueOnce(new Error("Fetch failed"));
    await expect(getWishlist()).rejects.toThrow("Fetch failed");
  });
});

describe("getCategories", () => {
  it("returns list of categories", async () => {
    mockedRequest.mockResolvedValueOnce({ categories: [mockCategory] });

    const result = await getCategories();

    expect(result).toEqual([mockCategory]);
    expect(mockedRequest).toHaveBeenCalledWith(CATEGORIES_QUERY);
  });

  it("returns empty array when no categories", async () => {
    mockedRequest.mockResolvedValueOnce({ categories: [] });

    const result = await getCategories();

    expect(result).toEqual([]);
  });
});

describe("getItem", () => {
  it("returns item when found", async () => {
    mockedRequest.mockResolvedValueOnce({ item: mockItem });

    const result = await getItem("item-1");

    expect(result).toEqual(mockItem);
    expect(mockedRequest).toHaveBeenCalledWith(ITEM_QUERY, { id: "item-1" });
  });

  it("returns null when item not found", async () => {
    mockedRequest.mockResolvedValueOnce({ item: null });

    const result = await getItem("nonexistent");

    expect(result).toBeNull();
  });
});

describe("createCategory", () => {
  it("creates and returns new category", async () => {
    mockedRequest.mockResolvedValueOnce({ createCategory: mockCategory });
    const input = { name: "Electronics", description: "Electronic items" };

    const result = await createCategory(input);

    expect(result).toEqual(mockCategory);
    expect(mockedRequest).toHaveBeenCalledWith(CREATE_CATEGORY_MUTATION, { input });
  });

  it("propagates errors", async () => {
    mockedRequest.mockRejectedValueOnce(new Error("Validation error"));
    await expect(createCategory({ name: "Test" })).rejects.toThrow("Validation error");
  });
});

describe("updateCategory", () => {
  it("updates and returns category", async () => {
    const updated = { ...mockCategory, name: "Updated" };
    mockedRequest.mockResolvedValueOnce({ updateCategory: updated });

    const result = await updateCategory("cat-1", { name: "Updated" });

    expect(result).toEqual(updated);
    expect(mockedRequest).toHaveBeenCalledWith(UPDATE_CATEGORY_MUTATION, {
      id: "cat-1",
      input: { name: "Updated" },
    });
  });

  it("returns null when category not found", async () => {
    mockedRequest.mockResolvedValueOnce({ updateCategory: null });

    const result = await updateCategory("nonexistent", { name: "X" });

    expect(result).toBeNull();
  });
});

describe("deleteCategory", () => {
  it("returns true on success", async () => {
    mockedRequest.mockResolvedValueOnce({ deleteCategory: true });

    const result = await deleteCategory("cat-1");

    expect(result).toBe(true);
    expect(mockedRequest).toHaveBeenCalledWith(DELETE_CATEGORY_MUTATION, { id: "cat-1" });
  });

  it("returns false when deletion fails", async () => {
    mockedRequest.mockResolvedValueOnce({ deleteCategory: false });

    const result = await deleteCategory("nonexistent");

    expect(result).toBe(false);
  });
});

describe("createItem", () => {
  it("creates and returns new item", async () => {
    mockedRequest.mockResolvedValueOnce({ createItem: mockItem });
    const input = { title: "Laptop", categoryId: "cat-1" };

    const result = await createItem(input);

    expect(result).toEqual(mockItem);
    expect(mockedRequest).toHaveBeenCalledWith(CREATE_ITEM_MUTATION, { input });
  });
});

describe("updateItem", () => {
  it("updates and returns item", async () => {
    const updated = { ...mockItem, title: "Gaming Laptop" };
    mockedRequest.mockResolvedValueOnce({ updateItem: updated });

    const result = await updateItem("item-1", { title: "Gaming Laptop" });

    expect(result).toEqual(updated);
    expect(mockedRequest).toHaveBeenCalledWith(UPDATE_ITEM_MUTATION, {
      id: "item-1",
      input: { title: "Gaming Laptop" },
    });
  });

  it("returns null when item not found", async () => {
    mockedRequest.mockResolvedValueOnce({ updateItem: null });

    const result = await updateItem("nonexistent", { title: "X" });

    expect(result).toBeNull();
  });
});

describe("deleteItem", () => {
  it("returns true on success", async () => {
    mockedRequest.mockResolvedValueOnce({ deleteItem: true });

    const result = await deleteItem("item-1");

    expect(result).toBe(true);
    expect(mockedRequest).toHaveBeenCalledWith(DELETE_ITEM_MUTATION, { id: "item-1" });
  });
});

describe("addItemLink", () => {
  it("adds and returns a link", async () => {
    mockedRequest.mockResolvedValueOnce({ addItemLink: mockLink });
    const input = { url: "https://example.com", description: "Product page" };

    const result = await addItemLink("item-1", input);

    expect(result).toEqual(mockLink);
    expect(mockedRequest).toHaveBeenCalledWith(ADD_ITEM_LINK_MUTATION, { itemId: "item-1", input });
  });
});

describe("updateItemLink", () => {
  it("updates and returns link", async () => {
    const updated = { ...mockLink, description: "Updated page" };
    mockedRequest.mockResolvedValueOnce({ updateItemLink: updated });

    const result = await updateItemLink("link-1", { description: "Updated page" });

    expect(result).toEqual(updated);
    expect(mockedRequest).toHaveBeenCalledWith(UPDATE_ITEM_LINK_MUTATION, {
      id: "link-1",
      input: { description: "Updated page" },
    });
  });

  it("returns null when link not found", async () => {
    mockedRequest.mockResolvedValueOnce({ updateItemLink: null });

    const result = await updateItemLink("nonexistent", {});

    expect(result).toBeNull();
  });
});

describe("deleteItemLink", () => {
  it("returns true on success", async () => {
    mockedRequest.mockResolvedValueOnce({ deleteItemLink: true });

    const result = await deleteItemLink("link-1");

    expect(result).toBe(true);
    expect(mockedRequest).toHaveBeenCalledWith(DELETE_ITEM_LINK_MUTATION, { id: "link-1" });
  });
});

describe("setPrimaryLink", () => {
  it("returns true on success", async () => {
    mockedRequest.mockResolvedValueOnce({ setPrimaryLink: true });

    const result = await setPrimaryLink("item-1", "link-1");

    expect(result).toBe(true);
    expect(mockedRequest).toHaveBeenCalledWith(SET_PRIMARY_LINK_MUTATION, {
      itemId: "item-1",
      linkId: "link-1",
    });
  });

  it("returns false when operation fails", async () => {
    mockedRequest.mockResolvedValueOnce({ setPrimaryLink: false });

    const result = await setPrimaryLink("item-1", "nonexistent");

    expect(result).toBe(false);
  });
});
