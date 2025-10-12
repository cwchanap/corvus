import type { DB } from "../../src/lib/db";
import type {
  WishlistCategory,
  WishlistItem,
  WishlistItemLink,
} from "../../src/lib/db/types";
import { WishlistService } from "../../src/lib/wishlist/service";

describe("WishlistService", () => {
  it("aggregates wishlist data with pagination and link mapping", async () => {
    const categories: WishlistCategory[] = [
      {
        id: "cat-1",
        user_id: 42,
        name: "Gadgets",
        color: "#FF0000",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "cat-2",
        user_id: 42,
        name: "Books",
        color: "#00FF00",
        created_at: "2024-01-02T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      },
    ];
    const items: WishlistItem[] = [
      {
        id: "item-1",
        user_id: 42,
        category_id: "cat-1",
        title: "Noise Cancelling Headphones",
        description: "Comfortable and quiet",
        favicon: null,
        created_at: "2024-01-05T00:00:00.000Z",
        updated_at: "2024-01-05T00:00:00.000Z",
      },
      {
        id: "item-2",
        user_id: 42,
        category_id: "cat-2",
        title: "Productivity Book",
        description: null,
        favicon: null,
        created_at: "2024-01-04T00:00:00.000Z",
        updated_at: "2024-01-04T00:00:00.000Z",
      },
    ];
    const links: WishlistItemLink[] = [
      {
        id: "link-1",
        item_id: "item-1",
        url: "https://shop.example/headphones",
        description: "Primary retailer",
        is_primary: true,
        created_at: "2024-01-05T00:00:00.000Z",
        updated_at: "2024-01-05T00:00:00.000Z",
      },
      {
        id: "link-2",
        item_id: "item-1",
        url: "https://shop2.example/headphones",
        description: null,
        is_primary: false,
        created_at: "2024-01-05T01:00:00.000Z",
        updated_at: "2024-01-05T01:00:00.000Z",
      },
    ];

    const orderAllMock = vi.fn().mockResolvedValue(links);
    const selectChain = {
      from: vi.fn(() => selectChain),
      where: vi.fn(() => selectChain),
      orderBy: vi.fn(() => ({ all: orderAllMock })),
    };

    const fakeDb: Partial<DB> = {
      select: vi.fn(() => selectChain),
    };

    let receivedOptions: Record<string, unknown> | undefined;

    class TestWishlistService extends WishlistService {
      constructor() {
        super(fakeDb as DB);
      }

      override async getUserCategories() {
        return categories;
      }

      override async getUserItems(
        _userId: number,
        options: Record<string, unknown> = {},
      ) {
        receivedOptions = options;
        return items;
      }

      override async getUserItemsCount() {
        return 5;
      }
    }

    const service = new TestWishlistService();
    const options = {
      limit: 2,
      offset: 2,
      categoryId: "cat-1",
      search: "shop",
    };

    const result = await service.getUserWishlistData(42, options);

    expect(receivedOptions).toEqual(options);
    expect(fakeDb.select).toHaveBeenCalledTimes(1);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
    expect(orderAllMock).toHaveBeenCalledTimes(1);

    expect(result.categories).toEqual(categories);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.links).toHaveLength(2);
    expect(result.items[0]?.links[0]?.is_primary).toBe(true);
    expect(result.pagination).toEqual({
      total_items: 5,
      page: 2,
      page_size: 2,
      total_pages: 3,
      has_next: true,
      has_previous: true,
    });
  });

  it("handles empty wishlists without querying for links", async () => {
    const fakeDb: Partial<DB> = {
      select: vi.fn(() => {
        throw new Error("Links should not be queried when there are no items");
      }),
    };

    class EmptyWishlistService extends WishlistService {
      constructor() {
        super(fakeDb as DB);
      }

      override async getUserCategories() {
        return [];
      }

      override async getUserItems() {
        return [];
      }

      override async getUserItemsCount() {
        return 0;
      }
    }

    const service = new EmptyWishlistService();
    const result = await service.getUserWishlistData(99);

    expect(result.categories).toEqual([]);
    expect(result.items).toEqual([]);
    expect(result.pagination).toEqual({
      total_items: 0,
      page: 1,
      page_size: 0,
      total_pages: 0,
      has_next: false,
      has_previous: false,
    });
    expect(fakeDb.select).not.toHaveBeenCalled();
  });
});
