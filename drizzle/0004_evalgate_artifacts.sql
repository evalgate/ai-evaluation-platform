CREATE TABLE IF NOT EXISTS "evalgate_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"evaluation_id" integer NOT NULL,
	"evaluation_run_id" integer,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"summary" jsonb NOT NULL,
	"payload" jsonb NOT NULL,
	"metadata" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "evalgate_artifacts" ADD CONSTRAINT "evalgate_artifacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evalgate_artifacts" ADD CONSTRAINT "evalgate_artifacts_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evalgate_artifacts" ADD CONSTRAINT "evalgate_artifacts_evaluation_run_id_evaluation_runs_id_fk" FOREIGN KEY ("evaluation_run_id") REFERENCES "public"."evaluation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evalgate_artifacts" ADD CONSTRAINT "evalgate_artifacts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evalgate_artifacts_org_kind_created" ON "evalgate_artifacts" USING btree ("organization_id","kind","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evalgate_artifacts_eval_created" ON "evalgate_artifacts" USING btree ("evaluation_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evalgate_artifacts_run_kind" ON "evalgate_artifacts" USING btree ("evaluation_run_id","kind");
