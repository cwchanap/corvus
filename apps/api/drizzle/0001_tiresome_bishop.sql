CREATE TABLE `wishlist_item_links` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `wishlist_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `wishlist_items` DROP COLUMN `url`;