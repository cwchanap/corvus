ALTER TABLE `wishlist_items` ADD `status` text DEFAULT 'want' NOT NULL;--> statement-breakpoint
ALTER TABLE `wishlist_items` ADD `priority` integer;--> statement-breakpoint
CREATE INDEX `wishlist_items_status_idx` ON `wishlist_items` (`status`);--> statement-breakpoint
CREATE CHECK `wishlist_items_priority_range` ON `wishlist_items` (`priority` IS NULL OR (`priority` >= 1 AND `priority` <= 5));
