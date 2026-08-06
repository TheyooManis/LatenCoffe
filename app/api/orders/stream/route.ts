import { auth } from "@/lib/auth";
import { subscribeToOrderChanges } from "@/lib/order-events";

export const dynamic = "force-dynamic";
// LISTEN needs a real TCP connection to Postgres, which the edge runtime
// cannot open.
export const runtime = "nodejs";

// Proxies and load balancers drop idle connections; a periodic comment keeps
// the stream warm without waking the client.
const HEARTBEAT_MS = 25_000;

/**
 * Server-Sent Events feed that pings connected staff whenever any order
 * changes. The payload carries no order data — clients re-fetch through the
 * authenticated page, so nothing sensitive rides on the stream.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: string) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Client already went away; cleanup runs via the abort handler.
        }
      };

      const cleanup = () => {
        unsubscribe?.();
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      if (request.signal.aborted) return cleanup();
      request.signal.addEventListener("abort", cleanup);

      // Tell the browser to wait a beat before retrying a dropped connection.
      send("retry: 3000\n\n");
      send("event: ready\ndata: {}\n\n");

      heartbeat = setInterval(() => send(": keepalive\n\n"), HEARTBEAT_MS);

      try {
        unsubscribe = await subscribeToOrderChanges(() => {
          send("event: order-changed\ndata: {}\n\n");
        });
      } catch {
        // Couldn't reach Postgres — close so EventSource retries rather than
        // holding a stream that will never deliver anything.
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering (nginx), which would otherwise hold events.
      "X-Accel-Buffering": "no",
    },
  });
}
