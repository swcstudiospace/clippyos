import { createFileRoute } from "@tanstack/react-router";
import { handleToken, mcpOauthJson, mcpOauthOptions } from "@/lib/server/mcp-oauth-http.server";

export const Route = createFileRoute("/oauth/token")({
  server: {
    handlers: {
      OPTIONS: () => mcpOauthOptions(),
      GET: () =>
        mcpOauthJson(405, { error: "invalid_request", error_description: "POST authorization_code or refresh_token." }),
      POST: ({ request }) => handleToken(request),
    },
  },
});
