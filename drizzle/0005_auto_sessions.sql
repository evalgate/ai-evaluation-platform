CREATE TABLE IF NOT EXISTS "auto_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"evaluation_id" integer NOT NULL,
	"created_by" text NOT NULL,
	"name" text NOT NULL,
	"objective" text NOT NULL,
	"target_path" text NOT NULL,
	"allowed_families" text DEFAULT '[]' NOT NULL,
	"max_iterations" integer DEFAULT 5 NOT NULL,
	"max_cost_usd" double precision,
	"status" text DEFAULT 'idle' NOT NULL,
	"job_id" integer,
	"current_iteration" integer DEFAULT 0 NOT NULL,
	"stop_reason" text,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "auto_sessions" ADD CONSTRAINT "auto_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_sessions" ADD CONSTRAINT "auto_sessions_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_sessions" ADD CONSTRAINT "auto_sessions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auto_sessions_org" ON "auto_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auto_sessions_eval" ON "auto_sessions" USING btree ("evaluation_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auto_experiments" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"iteration" integer NOT NULL,
	"mutation_family" text NOT NULL,
	"candidate_patch" text,
	"utility_score" double precision,
	"objective_reduction" double precision,
	"regressions" integer,
	"improvements" integer,
	"decision" text,
	"hard_veto_reason" text,
	"reflection" text,
	"details_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "auto_experiments" ADD CONSTRAINT "auto_experiments_session_id_auto_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."auto_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auto_experiments_session" ON "auto_experiments" USING btree ("session_id");
