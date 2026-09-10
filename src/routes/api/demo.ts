import { createFileRoute } from "@tanstack/react-router";
import { parseJsonObject } from "@/lib/safe-json";
import { publicErrorCode } from "@/lib/safe-error";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, unknown> = {};
        try {
          payload = parseJsonObject(await request.text());
        } catch {
          return json(400, { error: "VALIDATION" });
        }
        try {
          const { submitDemoRequest } = await import("@/lib/server/demo.server");
          const result = await submitDemoRequest({
            name: payload.name,
            email: payload.email,
            company: payload.company,
            role: payload.role,
            country: payload.country,
            message: payload.message,
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          });
          return json(200, result);
        } catch (error) {
          const code = publicErrorCode(error);
          const status = code === "DEMO_RATE_LIMIT" ? 429 : code === "VALIDATION" ? 400 : 500;
          return json(status, { error: code });
        }
      },
    },
  },
});
