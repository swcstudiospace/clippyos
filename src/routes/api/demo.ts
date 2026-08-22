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

export const Route = createFileRoute("/api/demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, unknown> = {};
        try {
          payload = (await request.json()) as Record<string, unknown>;
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
          const code = error instanceof Error ? error.message : "DATA_UNAVAILABLE";
          const status = code === "DEMO_RATE_LIMIT" ? 429 : code === "VALIDATION" ? 400 : 500;
          return json(status, { error: code });
        }
      },
    },
  },
});
