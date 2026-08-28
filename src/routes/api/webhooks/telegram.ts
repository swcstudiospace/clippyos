import { createFileRoute } from "@tanstack/react-router";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/webhooks/telegram")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { loadTelegramWebhookSecret, upsertInbound } = await import(
          "@/lib/server/channels.server"
        );
        const secret = await loadTelegramWebhookSecret();
        if (!secret) return json(503, { ok: false });
        const header = request.headers.get("x-telegram-bot-api-secret-token")?.trim() || "";
        if (header !== secret) return json(401, { ok: false });
        let payload: {
          message?: {
            message_id?: number;
            text?: string;
            caption?: string;
            chat?: { id?: number; first_name?: string; username?: string; title?: string };
          };
        };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return json(400, { ok: false });
        }
        const message = payload.message;
        const text = String(message?.text ?? message?.caption ?? "").trim();
        const chatId = message?.chat?.id;
        if (!text || chatId == null) return json(200, { ok: true });
        await upsertInbound({
          provider: "telegram",
          externalId: String(chatId),
          contactName: message?.chat?.first_name || message?.chat?.title || "Telegram",
          contactHandle: message?.chat?.username ? `@${message.chat.username}` : null,
          body: text,
          externalMessageId: message?.message_id != null ? String(message.message_id) : null,
        });
        return json(200, { ok: true });
      },
    },
  },
});
