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

/** Strip non-serializable icon field from catalog templates */
function serializeTemplate(template: Record<string, any>) {
  const { icon, ...rest } = template;
  return rest;
}

export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const category = searchParams.get('category');
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : undefined;

      // Merge both template libraries
      // Featured templates (from evaluation-templates-library.ts) get a source tag
      const featured = evaluationTemplates.map((t) => ({
        ...t,
        source: 'featured' as const,
        type: 'unit_test' as const,
        complexity: t.difficulty,
      }));

      // Catalog templates (from evaluation-templates.ts) get icon stripped
      let catalog = COMPREHENSIVE_TEMPLATES.map((t) => ({
        ...serializeTemplate(t),
        source: 'catalog' as const,
      }));

      // Combine
      let allTemplates = [...featured, ...catalog];

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
