import { createFileRoute } from "@tanstack/react-router";
import { handleDynamicClientRegistration, mcpOauthJson, mcpOauthOptions } from "@/lib/server/mcp-oauth-http.server";

export const Route = createFileRoute("/oauth/register")({
  server: {
    handlers: {
      OPTIONS: () => mcpOauthOptions(),
      GET: () => mcpOauthJson(405, { error: "invalid_request", error_description: "POST a DCR body to register." }),
      POST: ({ request }) => handleDynamicClientRegistration(request),
    },
  },
});
