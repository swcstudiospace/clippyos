import { createFileRoute } from "@tanstack/react-router";
import { McpOAuthConsentPage } from "@/components/mcp/oauth-consent";

export const Route = createFileRoute("/authorize")({
  component: McpOAuthConsentPage,
});
