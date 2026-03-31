ALTER TABLE `wishlist_items` ADD `status` text DEFAULT 'want' NOT NULL;--> statement-breakpoint
ALTER TABLE `wishlist_items` ADD `priority` integer;--> statement-breakpoint
CREATE INDEX `wishlist_items_status_idx` ON `wishlist_items` (`status`);--> statement-breakpoint
CREATE TRIGGER `wishlist_items_priority_range_insert`
BEFORE INSERT ON `wishlist_items`
FOR EACH ROW
WHEN NEW.`priority` IS NOT NULL AND (NEW.`priority` < 1 OR NEW.`priority` > 5)
BEGIN
    SELECT RAISE(FAIL, 'wishlist_items.priority must be between 1 and 5');
END;--> statement-breakpoint
CREATE TRIGGER `wishlist_items_priority_range_update`
BEFORE UPDATE OF `priority` ON `wishlist_items`
FOR EACH ROW
WHEN NEW.`priority` IS NOT NULL AND (NEW.`priority` < 1 OR NEW.`priority` > 5)
BEGIN
    SELECT RAISE(FAIL, 'wishlist_items.priority must be between 1 and 5');
END;
