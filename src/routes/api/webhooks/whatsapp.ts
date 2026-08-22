import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function validSignature(secret: string, raw: string, header: string): boolean {
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  const left = Buffer.from(expected);
  const right = Buffer.from(header);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { loadWhatsAppConfig } = await import("@/lib/server/channels.server");
        const config = await loadWhatsAppConfig();
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode === "subscribe" && config?.verifyToken && token === config.verifyToken && challenge) {
          return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
        }
        return json(403, { ok: false });
      },
      POST: async ({ request }) => {
        const { loadWhatsAppConfig, upsertInbound } = await import("@/lib/server/channels.server");
        const config = await loadWhatsAppConfig();
        if (!config) return json(503, { ok: false });
        const raw = await request.text();
        if (config?.appSecret) {
          const header = request.headers.get("x-hub-signature-256")?.trim() || "";
          if (!header || !validSignature(config.appSecret, raw, header)) {
            return json(401, { ok: false });
          }
        }
        let payload: {
          entry?: Array<{
            changes?: Array<{
              value?: {
                contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
                messages?: Array<{
                  from?: string;
                  id?: string;
                  type?: string;
                  text?: { body?: string };
                }>;
              };
            }>;
          }>;
        };
        try {
          payload = JSON.parse(raw) as typeof payload;
        } catch {
          return json(400, { ok: false });
        }
        for (const entry of payload.entry ?? []) {
          for (const change of entry.changes ?? []) {
            const value = change.value;
            const contacts = new Map(
              (value?.contacts ?? []).map((row) => [String(row.wa_id ?? ""), row.profile?.name ?? "WhatsApp"]),
            );
            for (const message of value?.messages ?? []) {
              const text = String(message.text?.body ?? "").trim();
              const from = String(message.from ?? "").trim();
              if (!text || !from) continue;
              await upsertInbound({
                provider: "whatsapp",
                externalId: from,
                contactName: contacts.get(from) || from,
                contactHandle: `+${from}`,
                body: text,
                externalMessageId: message.id ?? null,
              });
            }
          }
        }
        return json(200, { ok: true });
      },
    },
  },
});
