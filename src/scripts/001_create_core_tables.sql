-- AI Evaluation Platform - Core Database Schema
-- This script creates the foundational tables for users, organizations, and evaluations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('unit_test', 'human_eval', 'model_eval', 'ab_test')),
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluation runs table
CREATE TABLE IF NOT EXISTS public.evaluation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  failed_tests INTEGER NOT NULL DEFAULT 0,
  metrics JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id)
);

-- Test cases table
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  input JSONB NOT NULL,
  expected_output JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Test results table
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_run_id UUID NOT NULL REFERENCES public.evaluation_runs(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
  actual_output JSONB NOT NULL,
  assertions JSONB NOT NULL DEFAULT '[]',
  duration_ms INTEGER NOT NULL,
  error_message TEXT,
  trace_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metrics table
CREATE TABLE IF NOT EXISTS public.metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('accuracy', 'latency', 'cost', 'custom')),
  aggregation TEXT NOT NULL CHECK (aggregation IN ('avg', 'sum', 'min', 'max', 'p50', 'p95', 'p99')),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metric values table
CREATE TABLE IF NOT EXISTS public.metric_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES public.metrics(id) ON DELETE CASCADE,
  evaluation_run_id UUID REFERENCES public.evaluation_runs(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_org_id ON public.evaluations(organization_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON public.evaluations(type);
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_eval_id ON public.evaluation_runs(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_status ON public.evaluation_runs(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_eval_id ON public.test_cases(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON public.test_results(evaluation_run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_case_id ON public.test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_metric_id ON public.metric_values(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_timestamp ON public.metric_values(timestamp);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for organizations table
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update organizations" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- RLS Policies for organization_members table
CREATE POLICY "Users can view members of their organizations" ON public.organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for evaluations table
CREATE POLICY "Users can view evaluations in their organizations" ON public.evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = evaluations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluations in their organizations" ON public.evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = evaluations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update evaluations in their organizations" ON public.evaluations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = evaluations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
  );

-- RLS Policies for evaluation_runs table
CREATE POLICY "Users can view evaluation runs in their organizations" ON public.evaluation_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = evaluation_runs.evaluation_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluation runs in their organizations" ON public.evaluation_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = evaluation_runs.evaluation_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'member')
    )
  );

-- RLS Policies for test_cases table
CREATE POLICY "Users can view test cases in their organizations" ON public.test_cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = test_cases.evaluation_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage test cases in their organizations" ON public.test_cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = test_cases.evaluation_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'member')
    )
  );

-- RLS Policies for test_results table
CREATE POLICY "Users can view test results in their organizations" ON public.test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_runs er
      JOIN public.evaluations e ON e.id = er.evaluation_id
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE er.id = test_results.evaluation_run_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for metrics table
CREATE POLICY "Users can view metrics in their organizations" ON public.metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = metrics.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for metric_values table
CREATE POLICY "Users can view metric values in their organizations" ON public.metric_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.metrics m
      JOIN public.organization_members om ON om.organization_id = m.organization_id
      WHERE m.id = metric_values.metric_id
      AND om.user_id = auth.uid()
    )
  );
