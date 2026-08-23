import { createFileRoute } from "@tanstack/react-router";
import { handleProtectedResourceMetadata, mcpOauthOptions } from "@/lib/server/mcp-oauth-http.server";

export const Route = createFileRoute("/.well-known/oauth-protected-resource/api/mcp")({
  server: {
    handlers: {
      OPTIONS: () => mcpOauthOptions(),
      GET: ({ request }) => handleProtectedResourceMetadata(request),
    },
  },
});
