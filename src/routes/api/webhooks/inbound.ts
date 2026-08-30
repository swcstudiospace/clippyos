import { createFileRoute } from "@tanstack/react-router";
import { rateLimitOrThrow, readWebhookSecret } from "@/lib/server/autonomy-auth.server";
import { sanitizeRequestId } from "@/lib/security-headers";
import { verifyInboundSignature } from "@/lib/server/autonomy-events.server";
import { runAutonomyAction } from "@/lib/server/autonomy-actions.server";
import { readIdempotency, writeAuditLog, writeIdempotency } from "@/lib/server/autonomy-audit.server";
import { AGENT_MUTATIONS } from "@/lib/server/autonomy-policy.server";
import { INBOUND_COMMANDS } from "@/lib/autonomy";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/webhooks/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rid = sanitizeRequestId(request.headers.get("x-request-id"));
        const secret = await readWebhookSecret();
        if (!secret) {
          return json(503, {
            error: { code: "WEBHOOK_UNSET", message: "Inbound webhook secret isn’t configured." },
            requestId: rid,
          });
        }
        const raw = await request.text();
        const timestamp =
          request.headers.get("x-agency-timestamp") ?? request.headers.get("x-webhook-timestamp") ?? "";
        const signature =
          request.headers.get("x-agency-signature") ?? request.headers.get("x-webhook-signature") ?? "";
        const ok = verifyInboundSignature({ secret, timestamp, rawBody: raw, signature });
        if (!ok) {
          void writeAuditLog({
            requestId: rid,
            actor: { source: "webhook", keyId: null, label: "inbound" },
            action: "auth",
            result: "denied",
            errorCode: "INVALID_SIGNATURE",
          });
          return json(401, {
            error: { code: "INVALID_SIGNATURE", message: "Invalid webhook signature." },
            requestId: rid,
          });
        }
        try {
          rateLimitOrThrow("webhook:inbound");
        } catch {
          return json(429, { error: { code: "RATE_LIMITED", message: "Too many requests." }, requestId: rid });
        }

        let envelope: {
          id?: string;
          command?: string;
          payload?: Record<string, unknown>;
          playbook?: string;
          playbookId?: string;
          runId?: string;
          run_id?: string;
        };
        try {
          envelope = JSON.parse(raw) as typeof envelope;
        } catch {
          return json(400, { error: { code: "VALIDATION", message: "JSON body required." }, requestId: rid });
        }
        const command = String(envelope.command ?? "");
        if (!(INBOUND_COMMANDS as readonly string[]).includes(command)) {
          return json(400, { error: { code: "UNKNOWN_COMMAND", message: "Unsupported command." }, requestId: rid });
        }
        const cmdId = envelope.id?.trim();
        if (AGENT_MUTATIONS.has(command) && !cmdId) {
          return json(400, { error: { code: "VALIDATION", message: "id required." }, requestId: rid });
        }
        if (cmdId) {
          const cached = await readIdempotency(`wh:${cmdId}`);
          if (cached) {
            return new Response(cached, {
              status: 200,
              headers: { "Content-Type": "application/json; charset=utf-8" },
            });
          }
        }
        const result = await runAutonomyAction({
          actor: {
            source: "webhook",
            keyId: "webhook",
            label: "Inbound webhook",
            scopes: [
              "read",
              "write:progress",
              "write:payments",
              "write:leads",
              "write:clients",
              "actions:ai",
              "write:social",
            ],
          },
          action: command,
          payload: envelope.payload ?? {},
          requestId: rid,
          playbookId: envelope.playbook ?? envelope.playbookId ?? null,
          runId: envelope.runId ?? envelope.run_id ?? null,
        });
        if (!result.ok) {
          return json(result.status, {
            error: { code: result.code, message: result.message },
            requestId: rid,
          });
        }
        const encoded = JSON.stringify({ data: result.data, requestId: rid });
        if (cmdId) await writeIdempotency(`wh:${cmdId}`, encoded);
        return new Response(encoded, {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      },
    },
  },
});
