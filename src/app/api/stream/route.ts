// src/app/api/stream/route.ts
import { NextRequest } from 'next/server';
import { requireAuthWithOrg } from '@/lib/autumn-server';
import { sseServer, createSSEMessage, SSE_MESSAGE_TYPES } from '@/lib/streaming/sse-server';
import { logger } from '@/lib/logger';

/**
 * GET /api/stream
 * SSE endpoint for real-time streaming
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuthWithOrg(request);
  if (!authResult.authenticated) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { userId, organizationId } = authResult;
  const { searchParams } = new URL(request.url);
  
  // Get client preferences
  const clientId = searchParams.get('clientId') || `client_${Date.now()}_${Math.random()}`;
  const channels = searchParams.get('channels')?.split(',') || [];

  // Create SSE response
  const response = new Response(
    new ReadableStream({
      start(controller) {
        // Send initial connection message
        const welcomeMessage = createSSEMessage(
          SSE_MESSAGE_TYPES.CONNECTION_ESTABLISHED,
          {
            clientId,
            organizationId,
            userId,
            channels,
            timestamp: new Date().toISOString(),
          }
        );

        controller.enqueue(new TextEncoder().encode(
          `id: ${welcomeMessage.id}\nevent: ${welcomeMessage.type}\ndata: ${JSON.stringify(welcomeMessage.data)}\ntimestamp: ${welcomeMessage.timestamp}\n\n`
        ));

        // Add client to SSE server
        sseServer.addClient(clientId, response as any, organizationId, userId, channels);

        logger.info('SSE connection established', { clientId, organizationId, channels });
      },
      cancel() {
        // Clean up on disconnect
        sseServer.removeClient(clientId);
        logger.info('SSE connection closed', { clientId });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    }
  );

  return response;
}

/**
 * POST /api/stream
 * Send messages to SSE clients (internal API)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if (!authResult.authenticated) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { organizationId } = authResult;
    const body = await request.json();

    const { type, data, target, targetId } = body;

    if (!type || !data) {
      return new Response('Missing type or data', { status: 400 });
    }

    const message = createSSEMessage(type, data);

    let sentCount = 0;

    switch (target) {
      case 'organization':
        sentCount = sseServer.sendToOrganization(organizationId, message);
        break;
      case 'user':
        if (!targetId) {
          return new Response('Missing targetId for user target', { status: 400 });
        }
        sentCount = sseServer.sendToUser(targetId, message);
        break;
      case 'channel':
        if (!targetId) {
          return new Response('Missing targetId for channel target', { status: 400 });
        }
        sentCount = sseServer.sendToChannel(targetId, message);
        break;
      default:
        return new Response('Invalid target', { status: 400 });
    }

    return Response.json({
      success: true,
      sentCount,
      message: `Message sent to ${sentCount} clients`,
    });

  } catch (error: any) {
    logger.error('SSE POST error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
