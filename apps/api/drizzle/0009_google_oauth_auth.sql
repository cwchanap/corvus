CREATE TABLE `users` (
    `id` text PRIMARY KEY NOT NULL,
    `google_sub` text NOT NULL,
    `email` text NOT NULL,
    `name` text NOT NULL,
    `avatar_url` text,
    `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);
--> statement-breakpoint
CREATE TABLE `sessions` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `expires_at` text NOT NULL,
    `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);
