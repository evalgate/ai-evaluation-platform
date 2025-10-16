-- AI Evaluation Platform - A/B Testing Tables
-- This script creates tables for A/B testing functionality

-- A/B tests table
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  variant_a_id UUID NOT NULL,
  variant_b_id UUID NOT NULL,
  traffic_split NUMERIC NOT NULL DEFAULT 0.5 CHECK (traffic_split >= 0 AND traffic_split <= 1),
  status TEXT NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A/B test variants table
CREATE TABLE IF NOT EXISTS public.ab_test_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ab_test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A/B test results table
CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ab_test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.ab_test_variants(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT NOT NULL,
  outcome JSONB NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_org_id ON public.ab_tests(organization_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON public.ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_test_id ON public.ab_test_variants(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON public.ab_test_results(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant_id ON public.ab_test_results(variant_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_created_at ON public.ab_test_results(created_at);

-- Enable Row Level Security
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ab_tests table
CREATE POLICY "Users can view A/B tests in their organizations" ON public.ab_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = ab_tests.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create A/B tests in their organizations" ON public.ab_tests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = ab_tests.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
  );

-- RLS Policies for ab_test_variants table
CREATE POLICY "Users can view A/B test variants in their organizations" ON public.ab_test_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ab_tests abt
      JOIN public.organization_members om ON om.organization_id = abt.organization_id
      WHERE abt.id = ab_test_variants.ab_test_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for ab_test_results table
CREATE POLICY "Users can view A/B test results in their organizations" ON public.ab_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ab_tests abt
      JOIN public.organization_members om ON om.organization_id = abt.organization_id
      WHERE abt.id = ab_test_results.ab_test_id
      AND om.user_id = auth.uid()
    )
  );
