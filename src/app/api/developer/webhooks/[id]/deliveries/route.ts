import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookDeliveries, webhooks } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { secureRoute, type AuthContext } from '@/lib/api/secure-route';
import { notFound, forbidden, validationError } from '@/lib/api/errors';

export const GET = secureRoute(async (req: NextRequest, ctx: AuthContext, params) => {
  const webhookId = parseInt(params.id);

  if (isNaN(webhookId)) {
    return validationError('Valid webhook ID is required');
  }

  // Verify the parent webhook exists and belongs to this org
  const webhook = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, webhookId))
    .limit(1);

  if (webhook.length === 0) {
    return notFound('Webhook not found');
  }
  if (webhook[0].organizationId !== ctx.organizationId) {
    return forbidden('Webhook does not belong to your organization');
  }

  // Extract query parameters
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  if (status && !['success', 'failed', 'pending'].includes(status)) {
    return validationError('Invalid status. Must be one of: success, failed, pending');
  }

  // Build query conditions
  let whereConditions = eq(webhookDeliveries.webhookId, webhookId);

  if (status) {
    whereConditions = and(
      whereConditions,
      eq(webhookDeliveries.status, status)
    ) as typeof whereConditions;
  }

  // Fetch deliveries with pagination
  const deliveries = await db
    .select()
    .from(webhookDeliveries)
    .where(whereConditions)
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for the same conditions
  const totalCountResult = await db
    .select()
    .from(webhookDeliveries)
    .where(whereConditions);

  return NextResponse.json(
    {
      deliveries: deliveries.map(delivery => ({
        id: delivery.id,
        webhookId: delivery.webhookId,
        eventType: delivery.eventType,
        payload: delivery.payload,
        status: delivery.status,
        responseStatus: delivery.responseStatus,
        responseBody: delivery.responseBody,
        attemptCount: delivery.attemptCount,
        createdAt: delivery.createdAt
      })),
      total: totalCountResult.length
    },
    { status: 200 }
  );
})
