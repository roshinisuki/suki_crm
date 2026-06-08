import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userPayload = await verifyAuth();
  if (!userPayload) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let intervalId: NodeJS.Timeout;

      const poll = async () => {
        try {
          const notifications = await prisma.notification.findMany({
            where: { userId: userPayload.id },
            orderBy: { createdAt: "desc" },
            take: 20,
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ success: true, data: notifications })}\n\n`));
        } catch (e) {
          console.error("SSE Polling Error:", e);
        }
      };

      // Send immediately on connect
      await poll();
      
      // Poll every 8 seconds server-side instead of client HTTP polling
      intervalId = setInterval(poll, 8000);

      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
