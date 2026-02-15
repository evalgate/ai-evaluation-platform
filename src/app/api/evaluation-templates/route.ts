/**
 * GET /api/evaluation-templates
 * Public endpoint returning evaluation templates from both template libraries.
 * Supports ?category= and ?limit= query params.
 * Used by WebMCP list_evaluation_templates tool.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/api-rate-limit';
import { evaluationTemplates } from '@/lib/evaluation-templates-library';
import {
  COMPREHENSIVE_TEMPLATES,
  TEMPLATE_CATEGORIES,
} from '@/lib/evaluation-templates';

interface SerializedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  source: 'featured' | 'catalog';
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const category = searchParams.get('category');
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : undefined;

      // Featured templates (from evaluation-templates-library.ts)
      const featured: SerializedTemplate[] = evaluationTemplates.map((t) => ({
        ...t,
        source: 'featured' as const,
        type: 'unit_test' as const,
        complexity: t.difficulty,
      }));

      // Catalog templates (from evaluation-templates.ts) with icon stripped
      const catalog: SerializedTemplate[] = COMPREHENSIVE_TEMPLATES.map((t) => {
        const { icon, ...rest } = t;
        return { ...rest, source: 'catalog' as const };
      });

      // Combine
      let allTemplates: SerializedTemplate[] = [...featured, ...catalog];

      // Filter by category if provided
      if (category) {
        allTemplates = allTemplates.filter((t) => t.category === category);
      }

      // Apply limit
      const total = allTemplates.length;
      if (limit && limit > 0) {
        allTemplates = allTemplates.slice(0, limit);
      }

      return NextResponse.json({
        templates: allTemplates,
        total,
        categories: TEMPLATE_CATEGORIES.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
        })),
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  }, { customTier: 'anonymous' });
}
