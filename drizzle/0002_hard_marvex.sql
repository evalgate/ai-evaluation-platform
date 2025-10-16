ALTER TABLE `annotation_tasks` ADD `annotation_settings` text;--> statement-breakpoint
ALTER TABLE `evaluations` ADD `execution_settings` text;--> statement-breakpoint
ALTER TABLE `evaluations` ADD `model_settings` text;--> statement-breakpoint
ALTER TABLE `evaluations` ADD `custom_metrics` text;--> statement-breakpoint
ALTER TABLE `llm_judge_configs` ADD `settings` text;