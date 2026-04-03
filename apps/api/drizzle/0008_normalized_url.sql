-- Add normalized_url column with temporary default for existing rows
ALTER TABLE `wishlist_item_links` ADD `normalized_url` text DEFAULT '' NOT NULL;--> statement-breakpoint

-- Backfill: best-effort normalization using SQLite string functions.
-- Handles: lowercase, strip default ports (:443/:80), remove www. prefix, trim trailing slashes.
-- Edge cases (query-param sorting) are caught by the JS backfill script if needed.
-- New writes set this correctly at runtime via normalizeHttpUrl().
UPDATE `wishlist_item_links` SET `normalized_url` =
    RTRIM(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        LOWER(`url`),
                        'https://www.', 'https://'
                    ),
                    'http://www.', 'http://'
                ),
                ':443/', '/'
            ),
            ':80/', '/'
        ),
        '/'
    )
WHERE `normalized_url` = '';--> statement-breakpoint

-- Create index on normalized_url for duplicate detection queries
CREATE INDEX `wishlist_item_links_normalized_url_idx` ON `wishlist_item_links` (`normalized_url`);
