import type {
  WishlistCategory,
  WishlistData,
  WishlistItem,
  WishlistItemLink,
  WishlistItemsPage,
  WishlistPagination,
} from "../types/wishlist.js";
import type {
  WishlistCategoryRecord,
  WishlistDataRecord,
  WishlistItemLinkRecord,
  WishlistItemRecord,
  WishlistItemsPageRecord,
  WishlistPaginationRecord,
} from "../types/wishlist-record.js";

export interface WishlistApiClientOptions {
  baseUrl?: string;
  credentials?: RequestCredentials;
  fetchImpl?: typeof fetch;
}

export interface CreateWishlistItemInput {
  title: string;
  categoryId: string;
  description?: string;
  url?: string;
  linkDescription?: string;
  favicon?: string;
}

export interface AddWishlistItemLinkInput {
  url: string;
  description?: string;
  isPrimary?: boolean;
}

export interface CreateWishlistCategoryInput {
  name: string;
  color?: string;
}

export interface UpdateWishlistItemInput {
  title?: string;
  description?: string;
  categoryId?: string;
  favicon?: string | null;
}

export interface UpdateWishlistCategoryInput {
  name?: string;
  color?: string | null;
}

export interface UpdateWishlistItemLinkInput {
  url?: string;
  description?: string | null;
  isPrimary?: boolean;
}

export interface WishlistPaginationOptions {
  page?: number;
  pageSize?: number;
  categoryId?: string | null;
  search?: string | null;
}

export class WishlistApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "WishlistApiError";
    this.status = status;
    this.body = body;
  }
}

export class WishlistApiClient {
  private readonly baseUrl: string;
  private readonly credentials: RequestCredentials;
  private readonly fetchImpl: typeof fetch;

  constructor(options: WishlistApiClientOptions = {}) {
    this.baseUrl = options.baseUrl?.replace(/\/+$/, "") ?? "";
    this.credentials = options.credentials ?? "include";
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async getWishlist(
    options: WishlistPaginationOptions = {},
  ): Promise<WishlistData> {
    const record = await this.request<WishlistDataRecord>(
      this.buildPath("/api/wishlist", options),
    );
    return {
      categories: record.categories.map(deserializeCategory),
      items: record.items.map(deserializeItem),
      pagination: deserializePagination(record.pagination),
    };
  }

  async getWishlistItems(
    options: WishlistPaginationOptions = {},
  ): Promise<WishlistItemsPage> {
    const record = await this.request<WishlistItemsPageRecord>(
      this.buildPath("/api/wishlist/items", options),
    );

    return {
      items: record.items.map(deserializeItem),
      pagination: deserializePagination(record.pagination),
    };
  }

  async createItem(input: CreateWishlistItemInput): Promise<WishlistItem> {
    const payload = {
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      url: input.url,
      link_description: input.linkDescription,
      favicon: input.favicon,
    };

    const record = await this.request<
      WishlistItemRecord & {
        links?: WishlistItemLinkRecord[];
      }
    >("/api/wishlist/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return deserializeItem(record);
  }

  async updateItem(
    itemId: string,
    updates: UpdateWishlistItemInput,
  ): Promise<WishlistItem> {
    const payload: Record<string, unknown> = {};

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) {
      payload.description = updates.description ?? null;
    }
    if (updates.categoryId !== undefined) {
      payload.category_id = updates.categoryId;
    }
    if (updates.favicon !== undefined) {
      payload.favicon = updates.favicon ?? null;
    }

    const record = await this.request<WishlistItemRecord>(
      `/api/wishlist/items/${itemId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    return deserializeItem(record);
  }

  async addItemLink(
    itemId: string,
    input: AddWishlistItemLinkInput,
  ): Promise<WishlistItemLink> {
    const payload = {
      url: input.url,
      description: input.description,
      is_primary: input.isPrimary ?? false,
    };

    const record = await this.request<WishlistItemLinkRecord>(
      `/api/wishlist/items/${itemId}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    return deserializeLink(record);
  }

  async updateItemLink(
    itemId: string,
    linkId: string,
    updates: UpdateWishlistItemLinkInput,
  ): Promise<WishlistItemLink> {
    const payload: Record<string, unknown> = {};

    if (updates.url !== undefined) {
      payload.url = updates.url;
    }
    if (updates.description !== undefined) {
      payload.description = updates.description ?? null;
    }
    if (updates.isPrimary !== undefined) {
      payload.is_primary = updates.isPrimary;
    }

    const record = await this.request<WishlistItemLinkRecord>(
      `/api/wishlist/items/${itemId}/links/${linkId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    return deserializeLink(record);
  }

  async setPrimaryItemLink(itemId: string, linkId: string): Promise<void> {
    await this.request(
      `/api/wishlist/items/${itemId}/links/${linkId}/primary`,
      {
        method: "POST",
      },
    );
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.request(`/api/wishlist/items/${itemId}`, {
      method: "DELETE",
    });
  }

  async deleteItemLink(itemId: string, linkId: string): Promise<void> {
    await this.request(`/api/wishlist/items/${itemId}/links/${linkId}`, {
      method: "DELETE",
    });
  }

  async createCategory(
    input: CreateWishlistCategoryInput,
  ): Promise<WishlistCategory> {
    const record = await this.request<WishlistCategoryRecord>(
      "/api/wishlist/categories",
      {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          color: input.color,
        }),
      },
    );

    return deserializeCategory(record);
  }

  async updateCategory(
    categoryId: string,
    updates: UpdateWishlistCategoryInput,
  ): Promise<WishlistCategory> {
    const payload: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      payload.name = updates.name;
    }
    if (updates.color !== undefined) {
      payload.color = updates.color;
    }

    const record = await this.request<WishlistCategoryRecord>(
      `/api/wishlist/categories/${categoryId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    return deserializeCategory(record);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.request(`/api/wishlist/categories/${categoryId}`, {
      method: "DELETE",
    });
  }

  async getItemLinks(itemId: string): Promise<WishlistItemLink[]> {
    const records = await this.request<WishlistItemLinkRecord[]>(
      `/api/wishlist/items/${itemId}`,
    );

    return records.map(deserializeLink);
  }

  private async request<T = unknown>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = this.baseUrl
      ? `${this.baseUrl}${path}`
      : path.startsWith("http")
        ? path
        : path;

    const headers = new Headers(init.headers);
    if (
      init.body !== undefined &&
      !headers.has("Content-Type") &&
      typeof init.body === "string"
    ) {
      headers.set("Content-Type", "application/json");
    }

    const response = await this.fetchImpl(url, {
      ...init,
      credentials: this.credentials,
      headers,
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }

      const message =
        (body as { error?: string } | undefined)?.error ?? response.statusText;

      throw new WishlistApiError(
        message || "Unknown API error",
        response.status,
        body,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  private buildPath(
    basePath: string,
    options: WishlistPaginationOptions,
  ): string {
    const params = new URLSearchParams();

    if (options.page !== undefined) {
      params.set("page", String(options.page));
    }

    if (options.pageSize !== undefined) {
      params.set("pageSize", String(options.pageSize));
    }

    if (options.categoryId) {
      params.set("categoryId", options.categoryId);
    }

    const search = options.search?.trim();
    if (search) {
      params.set("search", search);
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }
}

function deserializeCategory(record: WishlistCategoryRecord): WishlistCategory {
  return {
    id: record.id,
    name: record.name,
    color: record.color ?? undefined,
    createdAt: new Date(record.created_at),
    userId:
      record.user_id !== undefined && record.user_id !== null
        ? String(record.user_id)
        : undefined,
  };
}

function deserializeItem(record: WishlistItemRecord): WishlistItem {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? undefined,
    categoryId: record.category_id,
    favicon: record.favicon ?? undefined,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
    userId:
      record.user_id !== undefined && record.user_id !== null
        ? String(record.user_id)
        : undefined,
    links: record.links?.map(deserializeLink),
  };
}

function deserializeLink(record: WishlistItemLinkRecord): WishlistItemLink {
  return {
    id: record.id,
    itemId: record.item_id,
    url: record.url,
    description: record.description ?? undefined,
    isPrimary: record.is_primary,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

function deserializePagination(
  record: WishlistPaginationRecord,
): WishlistPagination {
  return {
    totalItems: record.total_items,
    page: record.page,
    pageSize: record.page_size,
    totalPages: record.total_pages,
    hasNext: record.has_next,
    hasPrevious: record.has_previous,
  };
}
