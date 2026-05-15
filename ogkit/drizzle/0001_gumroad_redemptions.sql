CREATE TABLE `gumroad_redemptions` (
	`license_key_hash` varchar(64) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`redeemed_at` timestamp NOT NULL DEFAULT (now()),
	`gumroad_sale_id` varchar(255),
	CONSTRAINT `gumroad_redemptions_license_key_hash` PRIMARY KEY(`license_key_hash`)
);
--> statement-breakpoint
ALTER TABLE `gumroad_redemptions` ADD CONSTRAINT `gumroad_redemptions_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_gumroad_redemptions_user_id` ON `gumroad_redemptions` (`user_id`);
