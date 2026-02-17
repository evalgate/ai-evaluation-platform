import { NextRequest, NextResponse } from 'next/server';
import { secureRoute, type AuthContext } from '@/lib/api/secure-route';
import { notFound, validationError } from '@/lib/api/errors';
import { driftService } from '@/lib/services/drift.service';
import { SCOPES } from '@/lib/auth/scopes';

/**
 * PATCH /api/drift/alerts/[id] — acknowledge a drift alert
 */
export const PATCH = secureRoute(async (_req: NextRequest, ctx: AuthContext, params) => {
  const alertId = parseInt(params.id);
  if (isNaN(alertId)) return validationError('Valid alert ID required');

  const result = await driftService.acknowledgeAlert(alertId, ctx.organizationId);
  if (!result) return notFound('Alert not found');

  return NextResponse.json(result);
}, { requiredScopes: [SCOPES.EVAL_WRITE] });
