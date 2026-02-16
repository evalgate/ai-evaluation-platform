// src/app/api/stream/[evalId]/route.ts
import { NextRequest } from 'next/server';
import { sseServer, createSSEMessage, SSE_MESSAGE_TYPES } from '@/lib/streaming/sse-server';

/**
 * Per-evaluation SSE endpoint.
 * Client connects via EventSource(`/api/stream/${evalId}`) and receives
 * real-time progress events for that evaluation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evalId: string }> }
) {
  const { evalId } = await params;
  const channel = `eval:${evalId}`;
  const clientId = `${evalId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Parse org from query (set by the client-side hook)
  const orgId = parseInt(request.nextUrl.searchParams.get('orgId') || '0');

  const stream = new ReadableStream({
    start(controller) {
      // Register client with the SSE server
      const response = new Response(); // placeholder for client lookup
      sseServer.addClient(clientId, response, orgId, undefined, [channel], controller);

      // Send connection established event
      const msg = createSSEMessage(SSE_MESSAGE_TYPES.CONNECTION_ESTABLISHED, {
        clientId,
        evaluationId: evalId,
      });
      const formatted = `id: ${msg.id || Date.now()}\nevent: ${msg.type}\ndata: ${JSON.stringify(msg.data)}\n\n`;
      controller.enqueue(new TextEncoder().encode(formatted));
    },
    cancel() {
      sseServer.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
