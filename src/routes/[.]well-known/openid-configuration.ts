import { createFileRoute } from "@tanstack/react-router";
import { handleOpenIdConfiguration, mcpOauthOptions } from "@/lib/server/mcp-oauth-http.server";

export const Route = createFileRoute("/.well-known/openid-configuration")({
  server: {
    handlers: {
      OPTIONS: () => mcpOauthOptions(),
      GET: ({ request }) => handleOpenIdConfiguration(request),
    },
  },
});
