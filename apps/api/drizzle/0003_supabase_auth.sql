-- Migration: replace custom auth tables with Supabase Auth
-- Drop all existing data (no prod users) and rebuild with UUID user_id columns

PRAGMA foreign_keys=off;
--> statement-breakpoint

-- Clear application data (old integer user_ids are orphaned after this migration)
DELETE FROM `wishlist_item_links`;
--> statement-breakpoint
DELETE FROM `wishlist_items`;
--> statement-breakpoint
DELETE FROM `wishlist_categories`;
--> statement-breakpoint

-- Rebuild wishlist_categories: user_id integer -> text (Supabase UUID), drop FK to users
CREATE TABLE `wishlist_categories_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
DROP TABLE `wishlist_categories`;
--> statement-breakpoint
ALTER TABLE `wishlist_categories_new` RENAME TO `wishlist_categories`;
--> statement-breakpoint

-- Rebuild wishlist_items: user_id integer -> text (Supabase UUID), drop FK to users
CREATE TABLE `wishlist_items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`title` text NOT NULL,
	`description` text,
	`favicon` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `wishlist_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
DROP TABLE `wishlist_items`;
--> statement-breakpoint
ALTER TABLE `wishlist_items_new` RENAME TO `wishlist_items`;
--> statement-breakpoint

-- Drop sessions table (replaced by Supabase JWT sessions)
DROP TABLE IF EXISTS `sessions`;
--> statement-breakpoint

-- Drop users table (replaced by Supabase Auth)
DROP TABLE IF EXISTS `users`;
--> statement-breakpoint

PRAGMA foreign_keys=on;
