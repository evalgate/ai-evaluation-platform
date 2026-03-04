CREATE TABLE "candidate_eval_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"failure_report_id" integer,
	"trace_id" integer,
	"title" text NOT NULL,
	"tags" jsonb,
	"source_trace_ids" jsonb,
	"expected_constraints" jsonb,
	"minimized_input" jsonb,
	"eval_case_id" text NOT NULL,
	"quality_score" integer,
	"quality_verdict" text,
	"auto_promote_eligible" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'quarantined' NOT NULL,
	"rationale" text,
	"promoted_to_evaluation_id" integer,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failure_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"trace_id" integer,
	"span_id" text,
	"evaluation_run_id" integer,
	"category" text NOT NULL,
	"secondary_categories" jsonb,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"evidence" text,
	"confidence" integer NOT NULL,
	"detector_count" integer DEFAULT 1 NOT NULL,
	"detected_by" text NOT NULL,
	"suggested_fixes" jsonb,
	"lineage" jsonb,
	"group_hash" text,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"model_version" text,
	"prompt_version" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"trace_id" integer NOT NULL,
	"span_id" text,
	"feedback_type" text NOT NULL,
	"value" jsonb,
	"user_id_external" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_eval_cases" ADD CONSTRAINT "candidate_eval_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_eval_cases" ADD CONSTRAINT "candidate_eval_cases_failure_report_id_failure_reports_id_fk" FOREIGN KEY ("failure_report_id") REFERENCES "public"."failure_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_eval_cases" ADD CONSTRAINT "candidate_eval_cases_trace_id_traces_id_fk" FOREIGN KEY ("trace_id") REFERENCES "public"."traces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_eval_cases" ADD CONSTRAINT "candidate_eval_cases_promoted_to_evaluation_id_evaluations_id_fk" FOREIGN KEY ("promoted_to_evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_eval_cases" ADD CONSTRAINT "candidate_eval_cases_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failure_reports" ADD CONSTRAINT "failure_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failure_reports" ADD CONSTRAINT "failure_reports_trace_id_traces_id_fk" FOREIGN KEY ("trace_id") REFERENCES "public"."traces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failure_reports" ADD CONSTRAINT "failure_reports_evaluation_run_id_evaluation_runs_id_fk" FOREIGN KEY ("evaluation_run_id") REFERENCES "public"."evaluation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_trace_id_traces_id_fk" FOREIGN KEY ("trace_id") REFERENCES "public"."traces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_candidates_org_status" ON "candidate_eval_cases" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_candidates_org_auto_promote" ON "candidate_eval_cases" USING btree ("organization_id","auto_promote_eligible");--> statement-breakpoint
CREATE INDEX "idx_failure_reports_org_created" ON "failure_reports" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_failure_reports_group" ON "failure_reports" USING btree ("organization_id","group_hash");--> statement-breakpoint
CREATE INDEX "idx_user_feedback_trace" ON "user_feedback" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "idx_user_feedback_org_created" ON "user_feedback" USING btree ("organization_id","created_at");