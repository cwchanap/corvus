PRAGMA foreign_keys=off;
--> statement-breakpoint
CREATE TABLE `wishlist_items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`category_id` text,
	`title` text NOT NULL,
	`description` text,
	`favicon` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `wishlist_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `wishlist_items_new` (
	`id`,
	`user_id`,
	`category_id`,
	`title`,
	`description`,
	`favicon`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`user_id`,
	`category_id`,
	`title`,
	`description`,
	`favicon`,
	`created_at`,
	`updated_at`
FROM `wishlist_items`;
--> statement-breakpoint
DROP TABLE `wishlist_items`;
--> statement-breakpoint
ALTER TABLE `wishlist_items_new` RENAME TO `wishlist_items`;
--> statement-breakpoint
PRAGMA foreign_keys=on;
