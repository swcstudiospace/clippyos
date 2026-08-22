import { createFileRoute } from "@tanstack/react-router";
import { authenticateMcpToken } from "@/lib/server/autonomy-auth.server";
import { handleMcpRpc } from "@/lib/server/mcp.server";
import { writeAuditLog } from "@/lib/server/autonomy-audit.server";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function sseWrap(payload: unknown): Response {
  const data = JSON.stringify(payload);
  return new Response(`event: message\ndata: ${data}\n\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function handle(request: Request): Promise<Response> {
  const rid = request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
  if (request.method === "GET") {
    return json(200, {
      name: "clippy-admin",
      transport: "streamable-http",
      protocol: "2025-03-26",
      capabilities: {
        tools: { listChanged: true },
        resources: { listChanged: true },
        skills: { listChanged: true },
        tasks: {},
      },
    });
  }
  let actor;
  try {
    actor = await authenticateMcpToken(request.headers.get("authorization"));
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNAUTHORIZED";
    if (code === "RATE_LIMITED") {
      return json(429, { error: { code, message: "Too many requests." } });
    }
    void writeAuditLog({
      requestId: rid,
      actor: { source: "mcp", keyId: null, label: "unknown" },
      action: "auth",
      result: "denied",
      errorCode: "UNAUTHORIZED",
    });
    return json(401, { error: { code: "UNAUTHORIZED", message: "Invalid MCP token." } });
  }

  let body: { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json(400, { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null });
  }

  const result = await handleMcpRpc(body, actor, rid);
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/event-stream")) return sseWrap(result);
  return json(200, result);
}

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
