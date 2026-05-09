CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `quiz_attempt` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`answer` integer NOT NULL,
	`is_correct` integer NOT NULL,
	`answered_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `quiz_question`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_attempt_user_id_idx` ON `quiz_attempt` (`user_id`);--> statement-breakpoint
CREATE INDEX `quiz_attempt_question_id_idx` ON `quiz_attempt` (`question_id`);--> statement-breakpoint
CREATE INDEX `quiz_attempt_user_correct_idx` ON `quiz_attempt` (`user_id`,`is_correct`);--> statement-breakpoint
CREATE TABLE `quiz_question` (
	`id` text PRIMARY KEY NOT NULL,
	`difficulty` text NOT NULL,
	`han` integer NOT NULL,
	`fu` integer NOT NULL,
	`is_oya` integer DEFAULT false NOT NULL,
	`is_tsumo` integer DEFAULT false NOT NULL,
	`description` text NOT NULL,
	`correct_answer` integer NOT NULL,
	`choices` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quiz_question_difficulty_idx` ON `quiz_question` (`difficulty`);--> statement-breakpoint
CREATE TABLE `quiz_question_yaku` (
	`question_id` text NOT NULL,
	`yaku_id` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `quiz_question`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`yaku_id`) REFERENCES `yaku`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `yaku` (
	`id` text PRIMARY KEY NOT NULL,
	`name_ja` text NOT NULL,
	`name_reading` text NOT NULL,
	`name_en` text NOT NULL,
	`han` integer NOT NULL,
	`han_open` integer,
	`is_yakuman` integer DEFAULT false NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`conditions` text NOT NULL,
	`examples` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `yaku_category_idx` ON `yaku` (`category`);--> statement-breakpoint
CREATE INDEX `yaku_han_idx` ON `yaku` (`han`);--> statement-breakpoint
CREATE INDEX `yaku_is_yakuman_idx` ON `yaku` (`is_yakuman`);