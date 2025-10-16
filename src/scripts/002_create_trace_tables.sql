-- AI Evaluation Platform - Trace and Span Tables
-- This script creates tables for storing LLM traces and spans

-- Traces table
CREATE TABLE IF NOT EXISTS public.traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_id TEXT,
  name TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spans table
CREATE TABLE IF NOT EXISTS public.spans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trace_id UUID NOT NULL REFERENCES public.traces(id) ON DELETE CASCADE,
  parent_span_id UUID REFERENCES public.spans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  span_type TEXT NOT NULL CHECK (span_type IN ('llm', 'tool', 'agent', 'retrieval', 'custom')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  input JSONB NOT NULL,
  output JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_traces_org_id ON public.traces(organization_id);
CREATE INDEX IF NOT EXISTS idx_traces_session_id ON public.traces(session_id);
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON public.traces(created_at);
CREATE INDEX IF NOT EXISTS idx_traces_tags ON public.traces USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_spans_trace_id ON public.spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_spans_parent_span_id ON public.spans(parent_span_id);
CREATE INDEX IF NOT EXISTS idx_spans_span_type ON public.spans(span_type);
CREATE INDEX IF NOT EXISTS idx_spans_start_time ON public.spans(start_time);

-- Enable Row Level Security
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for traces table
CREATE POLICY "Users can view traces in their organizations" ON public.traces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = traces.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create traces in their organizations" ON public.traces
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = traces.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for spans table
CREATE POLICY "Users can view spans in their organizations" ON public.spans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.traces t
      JOIN public.organization_members om ON om.organization_id = t.organization_id
      WHERE t.id = spans.trace_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create spans in their organizations" ON public.spans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.traces t
      JOIN public.organization_members om ON om.organization_id = t.organization_id
      WHERE t.id = spans.trace_id
      AND om.user_id = auth.uid()
    )
  );
