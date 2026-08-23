import { createFileRoute } from "@tanstack/react-router";
import { handleAuthorizationServerMetadata, mcpOauthOptions } from "@/lib/server/mcp-oauth-http.server";

export const Route = createFileRoute("/.well-known/oauth-authorization-server")({
  server: {
    handlers: {
      OPTIONS: () => mcpOauthOptions(),
      GET: ({ request }) => handleAuthorizationServerMetadata(request),
    },
  },
});
