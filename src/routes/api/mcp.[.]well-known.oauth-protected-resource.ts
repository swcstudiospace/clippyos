import { createFileRoute } from "@tanstack/react-router";
import { handleProtectedResourceMetadata, mcpOauthOptions } from "@/lib/server/mcp-oauth-http.server";

export const Route = createFileRoute("/api/mcp/.well-known/oauth-protected-resource")({
  server: {
    handlers: {
      OPTIONS: () => mcpOauthOptions(),
      GET: ({ request }) => handleProtectedResourceMetadata(request),
    },
  },
});
