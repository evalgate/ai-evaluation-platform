ALTER TABLE "traces" ADD COLUMN "analysis_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "traces" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "traces" ADD COLUMN "environment" text;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_traces_org_trace_id" ON "traces" USING btree ("organization_id","trace_id");