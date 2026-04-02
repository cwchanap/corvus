-- Add normalized_url column with temporary default for existing rows
ALTER TABLE `wishlist_item_links` ADD `normalized_url` text DEFAULT '' NOT NULL;--> statement-breakpoint

-- Backfill: set normalized_url from url. Since SQLite doesn't support URL normalization
-- in SQL, we populate with the current url value as a best-effort baseline.
-- Run `bun db:backfill-normalized-urls` (or `--remote` for production) after deploying
-- to normalize all existing rows via JS. New writes set this correctly at runtime.
UPDATE `wishlist_item_links` SET `normalized_url` = `url` WHERE `normalized_url` = '';--> statement-breakpoint

-- Create index on normalized_url for duplicate detection queries
CREATE INDEX `wishlist_item_links_normalized_url_idx` ON `wishlist_item_links` (`normalized_url`);
