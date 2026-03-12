WITH ranked_categories AS (
    SELECT
        `id`,
        FIRST_VALUE(`id`) OVER (
            PARTITION BY `user_id`, `name`
            ORDER BY `created_at` ASC, `id` ASC
        ) AS `canonical_id`,
        ROW_NUMBER() OVER (
            PARTITION BY `user_id`, `name`
            ORDER BY `created_at` ASC, `id` ASC
        ) AS `duplicate_rank`
    FROM `wishlist_categories`
)
UPDATE `wishlist_items`
SET `category_id` = (
    SELECT `canonical_id`
    FROM ranked_categories
    WHERE ranked_categories.`id` = `wishlist_items`.`category_id`
)
WHERE `category_id` IN (
    SELECT `id`
    FROM ranked_categories
    WHERE `duplicate_rank` > 1
);
--> statement-breakpoint
WITH ranked_categories AS (
    SELECT
        `id`,
        ROW_NUMBER() OVER (
            PARTITION BY `user_id`, `name`
            ORDER BY `created_at` ASC, `id` ASC
        ) AS `duplicate_rank`
    FROM `wishlist_categories`
)
DELETE FROM `wishlist_categories`
WHERE `id` IN (
    SELECT `id`
    FROM ranked_categories
    WHERE `duplicate_rank` > 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wishlist_categories_user_id_name_unique`
ON `wishlist_categories` (`user_id`, `name`);
