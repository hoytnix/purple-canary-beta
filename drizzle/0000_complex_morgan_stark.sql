CREATE TABLE `scans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`substance_name` text,
	`result_data` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_session_id` text,
	`amount` integer,
	`currency` text DEFAULT 'usd',
	`status` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_stripe_session_id_unique` ON `transactions` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`public_key` text PRIMARY KEY NOT NULL,
	`nonce` integer DEFAULT 0,
	`stripe_customer_id` text,
	`username` text DEFAULT 'Shaggy',
	`tier` text DEFAULT 'free',
	`access` text DEFAULT 'Alpha',
	`shipping_name` text,
	`shipping_address` text,
	`shipping_city` text,
	`shipping_zip` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_login` text DEFAULT (CURRENT_TIMESTAMP)
);
