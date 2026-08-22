import { createFileRoute } from "@tanstack/react-router";
import { loadAirwallexConfig, verifyAirwallexSignature } from "@/lib/server/airwallex.server";
import { handleAirwallexWebhook } from "@/lib/server/billing.server";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function eventNameOf(payload: Record<string, unknown>): string {
  const name = payload.name ?? payload.event_type ?? payload.type ?? payload.eventType;
  return typeof name === "string" ? name : "";
}

function eventIdOf(payload: Record<string, unknown>): string {
  const id = payload.id ?? payload.event_id ?? payload.eventId;
  return typeof id === "string" && id.trim() ? id : crypto.randomUUID();
}

export const Route = createFileRoute("/api/webhooks/airwallex")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = await loadAirwallexConfig();
        if (!config?.webhookSecret) {
          return json(503, { error: { code: "WEBHOOK_UNSET", message: "Airwallex webhook secret isn’t configured." } });
        }
        const raw = await request.text();
        const timestamp = request.headers.get("x-timestamp") ?? "";
        const signature = request.headers.get("x-signature") ?? "";
        const ok = verifyAirwallexSignature({
          secret: config.webhookSecret,
          timestamp,
          rawBody: raw,
          signature,
        });
        if (!ok) {
          return json(401, { error: { code: "INVALID_SIGNATURE", message: "Invalid webhook signature." } });
        }
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          return json(400, { error: { code: "VALIDATION", message: "JSON body required." } });
        }
        const data =
          payload.data && typeof payload.data === "object"
            ? (payload.data as Record<string, unknown>)
            : payload;
        await handleAirwallexWebhook(eventIdOf(payload), eventNameOf(payload), data);
        return json(200, { received: true });
      },
    },
  },
});
