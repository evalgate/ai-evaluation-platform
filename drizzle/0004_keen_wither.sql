CREATE TABLE `human_annotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`evaluation_run_id` integer NOT NULL,
	`test_case_id` integer NOT NULL,
	`annotator_id` text NOT NULL,
	`rating` integer,
	`feedback` text,
	`labels` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`evaluation_run_id`) REFERENCES `evaluation_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`test_case_id`) REFERENCES `test_cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`annotator_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trace_id` integer NOT NULL,
	`span_id` text NOT NULL,
	`parent_span_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`start_time` text,
	`end_time` text,
	`duration_ms` integer,
	`input` text,
	`output` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`trace_id`) REFERENCES `traces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spans_span_id_unique` ON `spans` (`span_id`);--> statement-breakpoint
CREATE TABLE `test_cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`evaluation_id` integer NOT NULL,
	`name` text NOT NULL,
	`input` text NOT NULL,
	`expected_output` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `test_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`evaluation_run_id` integer NOT NULL,
	`test_case_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`output` text,
	`score` integer,
	`error` text,
	`duration_ms` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`evaluation_run_id`) REFERENCES `evaluation_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`test_case_id`) REFERENCES `test_cases`(`id`) ON UPDATE no action ON DELETE no action
);
