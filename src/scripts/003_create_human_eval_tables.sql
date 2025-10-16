-- AI Evaluation Platform - Human Evaluation Tables
-- This script creates tables for human annotations and annotation tasks

-- Human annotations table
CREATE TABLE IF NOT EXISTS public.human_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_run_id UUID NOT NULL REFERENCES public.evaluation_runs(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  annotator_id UUID NOT NULL REFERENCES public.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  labels JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Annotation tasks table
CREATE TABLE IF NOT EXISTS public.annotation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_run_id UUID NOT NULL REFERENCES public.evaluation_runs(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LLM judge results table
CREATE TABLE IF NOT EXISTS public.llm_judge_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_run_id UUID NOT NULL REFERENCES public.evaluation_runs(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  judge_model TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 1),
  reasoning TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_human_annotations_run_id ON public.human_annotations(evaluation_run_id);
CREATE INDEX IF NOT EXISTS idx_human_annotations_annotator_id ON public.human_annotations(annotator_id);
CREATE INDEX IF NOT EXISTS idx_annotation_tasks_run_id ON public.annotation_tasks(evaluation_run_id);
CREATE INDEX IF NOT EXISTS idx_annotation_tasks_assigned_to ON public.annotation_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_annotation_tasks_status ON public.annotation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_llm_judge_results_run_id ON public.llm_judge_results(evaluation_run_id);

-- Enable Row Level Security
ALTER TABLE public.human_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_judge_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for human_annotations table
CREATE POLICY "Users can view annotations in their organizations" ON public.human_annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_runs er
      JOIN public.evaluations e ON e.id = er.evaluation_id
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE er.id = human_annotations.evaluation_run_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own annotations" ON public.human_annotations
  FOR INSERT WITH CHECK (
    annotator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.evaluation_runs er
      JOIN public.evaluations e ON e.id = er.evaluation_id
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE er.id = human_annotations.evaluation_run_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for annotation_tasks table
CREATE POLICY "Users can view annotation tasks in their organizations" ON public.annotation_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_runs er
      JOIN public.evaluations e ON e.id = er.evaluation_id
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE er.id = annotation_tasks.evaluation_run_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for llm_judge_results table
CREATE POLICY "Users can view LLM judge results in their organizations" ON public.llm_judge_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_runs er
      JOIN public.evaluations e ON e.id = er.evaluation_id
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE er.id = llm_judge_results.evaluation_run_id
      AND om.user_id = auth.uid()
    )
  );
