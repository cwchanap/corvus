-- Add normalized_url column with temporary default for existing rows
ALTER TABLE `wishlist_item_links` ADD `normalized_url` text DEFAULT '' NOT NULL;--> statement-breakpoint

-- Backfill: approximate normalization using SQLite string functions.
-- Handles: lowercase hostname, strip default ports (:443/:80), remove www. prefix, trim trailing slashes.
-- IMPORTANT: This is intentionally a rough approximation. SQL cannot sort query parameters
-- or fully parse URLs. Running `bun db:backfill-normalized-urls` (local) or
-- `bun db:backfill-normalized-urls:remote` (production) is MANDATORY after applying this
-- migration to re-normalize every row with the exact runtime normalizeHttpUrl() function.
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
