CREATE TABLE `account` (
	`userId` varchar(36) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` varchar(255),
	`access_token` varchar(255),
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` varchar(2048),
	`session_state` varchar(255),
	CONSTRAINT `account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT 'default',
	`prefix` varchar(64) NOT NULL,
	`hash` varchar(255) NOT NULL,
	`allowed_domains` json NOT NULL,
	`require_signed_urls` boolean NOT NULL DEFAULT false,
	`last_used_at` timestamp(3),
	`revoked_at` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crypto_billing_orders` (
	`order_id` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`plan` enum('pro','scale') NOT NULL,
	`status` enum('pending','paid') NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crypto_billing_orders_order_id` PRIMARY KEY(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `funnel_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36),
	`email` varchar(255),
	`event_name` varchar(128) NOT NULL,
	`source` varchar(128) NOT NULL DEFAULT 'server',
	`properties` json NOT NULL,
	`notified_at` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `funnel_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `subscription_waitlist` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`plan_interest` enum('pro','scale') NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_waitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_waitlist_email_plan` UNIQUE(`email`,`plan_interest`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`lemon_subscription_id` varchar(255) NOT NULL,
	`lemon_variant_id` varchar(255) NOT NULL,
	`lemon_customer_id` varchar(255) NOT NULL,
	`plan_tier` enum('free','pro','scale') NOT NULL DEFAULT 'free',
	`subscription_status` enum('trialing','active','past_due','canceled','incomplete') NOT NULL,
	`current_period_start` timestamp(3) NOT NULL,
	`current_period_end` timestamp(3) NOT NULL,
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_lemon_subscription_id_unique` UNIQUE(`lemon_subscription_id`)
);
--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`api_key_id` varchar(36),
	`template` varchar(512) NOT NULL,
	`cache_hit` boolean NOT NULL DEFAULT false,
	`status` int NOT NULL DEFAULT 200,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3),
	`image` varchar(255),
	`plan_tier` enum('free','pro','scale') NOT NULL DEFAULT 'free',
	`lemon_customer_id` varchar(255),
	`crypto_paid_until` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `verificationToken_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crypto_billing_orders` ADD CONSTRAINT `crypto_billing_orders_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `funnel_events` ADD CONSTRAINT `funnel_events_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_events` ADD CONSTRAINT `usage_events_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_events` ADD CONSTRAINT `usage_events_api_key_id_api_keys_id_fk` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_api_keys_user_id` ON `api_keys` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_prefix` ON `api_keys` (`prefix`);--> statement-breakpoint
CREATE INDEX `idx_crypto_billing_orders_user_id` ON `crypto_billing_orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_funnel_events_event_name_created_at` ON `funnel_events` (`event_name`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_funnel_events_user_id_created_at` ON `funnel_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_funnel_events_email_created_at` ON `funnel_events` (`email`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_user_id` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_usage_events_user_id_created_at` ON `usage_events` (`user_id`,`created_at`);