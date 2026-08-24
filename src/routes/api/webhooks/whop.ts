import { createFileRoute } from "@tanstack/react-router";
import { loadWhopConfig, verifyWhopSignature } from "@/lib/server/whop.server";
import { handleWhopWebhook } from "@/lib/server/billing.server";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/webhooks/whop")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = await loadWhopConfig();
        if (!config?.webhookSecret) {
          return json(503, {
            error: { code: "WEBHOOK_UNSET", message: "Whop webhook secret isn’t configured." },
          });
        }
        const raw = await request.text();
        // Standard Webhooks headers are contractually frozen across API versions.
        const ok = verifyWhopSignature({
          secret: config.webhookSecret,
          id: request.headers.get("webhook-id") ?? "",
          timestamp: request.headers.get("webhook-timestamp") ?? "",
          rawBody: raw,
          signatureHeader: request.headers.get("webhook-signature") ?? "",
        });
        if (!ok) {
          return json(401, {
            error: { code: "BAD_SIGNATURE", message: "Invalid Whop webhook signature." },
          });
        }
        let payload: { id?: unknown; type?: unknown; data?: unknown };
        try {
          payload = JSON.parse(raw) as typeof payload;
        } catch {
          return json(400, { error: { code: "BAD_PAYLOAD", message: "Body is not JSON." } });
        }
        const data =
          payload.data && typeof payload.data === "object"
            ? (payload.data as Record<string, unknown>)
            : {};
        await handleWhopWebhook(
          typeof payload.id === "string" ? payload.id : "",
          typeof payload.type === "string" ? payload.type : "",
          data,
        );
        return json(200, { received: true });
      },
    },
  },
});
