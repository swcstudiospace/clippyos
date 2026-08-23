import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSessionUser } from "@/lib/auth/verify.server";
import { requireAdmin } from "@/lib/server/access";
import { CANONICAL_APP_ORIGIN } from "@/lib/app-hosts";
import { publicOrigin } from "@/lib/server/public-origin";

const authorizeFields = z.object({
  response_type: z.string().optional(),
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string().optional(),
  code_challenge: z.string(),
  code_challenge_method: z.string().optional(),
  scope: z.string().optional(),
  resource: z.string().optional(),
});

function toParams(data: z.infer<typeof authorizeFields>, origin: string) {
  const params = new URLSearchParams();
  params.set("response_type", data.response_type || "code");
  params.set("client_id", data.client_id);
  params.set("redirect_uri", data.redirect_uri);
  if (data.state) params.set("state", data.state);
  params.set("code_challenge", data.code_challenge);
  params.set("code_challenge_method", data.code_challenge_method || "S256");
  if (data.scope) params.set("scope", data.scope);
  if (data.resource) params.set("resource", data.resource);
  return params;
}

export const getMcpOAuthConsentFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => authorizeFields.parse(input))
  .handler(async ({ data }) => {
    const { parseAuthorizeRequest, previewMcpOAuthConsent } = await import(
      "@/lib/server/mcp-oauth.server"
    );
    const { getUserRole } = await import("@/lib/server/access");
    const origin = publicOrigin() || CANONICAL_APP_ORIGIN;
    const user = await getSessionUser();
    const role = user ? await getUserRole(user.id) : null;
    const params = parseAuthorizeRequest(toParams(data, origin), origin);
    return previewMcpOAuthConsent({
      params,
      origin,
      userId: user?.id ?? null,
      isAdmin: role === "admin",
    });
  });

export const decideMcpOAuthConsentFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    authorizeFields
      .extend({
        decision: z.enum(["allow", "deny"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { parseAuthorizeRequest, issueMcpAuthorizationCode, denyMcpAuthorization } = await import(
      "@/lib/server/mcp-oauth.server"
    );
    const origin = publicOrigin() || CANONICAL_APP_ORIGIN;
    const params = parseAuthorizeRequest(toParams(data, origin), origin);
    if (data.decision === "deny") return denyMcpAuthorization({ params });
    return issueMcpAuthorizationCode({ params, origin, userId: context.userId });
  });

export const revokeMcpOAuthGrantFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const { revokeMcpOAuthGrant } = await import("@/lib/server/mcp-oauth.server");
    const { buildRemoteMcpSnapshot } = await import("@/lib/server/remote-mcp.server");
    await revokeMcpOAuthGrant(id);
    return buildRemoteMcpSnapshot();
  });
