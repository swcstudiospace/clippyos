import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getPortalBearerToken,
  type PortalActivityItem,
  type PortalAsset,
  type PortalHome,
  type PortalInvitePreview,
  type PortalSession,
} from "@/lib/portal";
import type { ApprovalRequest } from "@/lib/safety";

export const portalMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    return next({ sendContext: { portalToken: getPortalBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    assertSameSiteRequest();
    const { resolvePortalSession } = await import("@/lib/server/portal.server");
    const portal = await resolvePortalSession(
      (context as { portalToken?: string }).portalToken,
    );
    if (!portal) {
      const error = new Error("Unauthorized");
      (error as Error & { status?: number }).status = 401;
      throw error;
    }
    return next({ context: { portal } });
  });

export const peekPortalInviteFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ token: z.string().min(8).max(200) }).parse(input))
  .handler(async ({ data }): Promise<PortalInvitePreview> => {
    const { peekInvite } = await import("@/lib/server/portal.server");
    return peekInvite(data.token);
  });

export const activatePortalInviteFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        token: z.string().min(8).max(200),
        password: z.string().min(8).max(200),
        name: z.string().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { activateInvite } = await import("@/lib/server/portal.server");
    return activateInvite({
      token: data.token,
      password: data.password,
      name: data.name,
    });
  });

export const portalLoginFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        email: z.string().email().max(200),
        password: z.string().min(8).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { portalPasswordLogin } = await import("@/lib/server/portal.server");
    return portalPasswordLogin(data);
  });

export const portalLogoutFn = createServerFn({ method: "POST" })
  .middleware([
    createMiddleware({ type: "function" })
      .client(async ({ next }) => {
        return next({ sendContext: { portalToken: getPortalBearerToken() ?? undefined } });
      })
      .server(async ({ next, context }) =>
        next({ context: { portalToken: (context as { portalToken?: string }).portalToken } }),
      ),
  ])
  .handler(async ({ context }) => {
    const { portalLogout } = await import("@/lib/server/portal.server");
    await portalLogout((context as { portalToken?: string }).portalToken);
    return { ok: true as const };
  });

export const getPortalSessionFn = createServerFn({ method: "GET" })
  .middleware([portalMiddleware])
  .handler(async ({ context }): Promise<PortalSession> => context.portal);

export const getPortalHomeFn = createServerFn({ method: "GET" })
  .middleware([portalMiddleware])
  .handler(async ({ context }): Promise<PortalHome> => {
    const { loadPortalHome } = await import("@/lib/server/portal.server");
    return loadPortalHome(context.portal);
  });

export const listPortalAssetsFn = createServerFn({ method: "POST" })
  .middleware([portalMiddleware])
  .validator((input: unknown) =>
    z.object({ kind: z.enum(["ALL", "VIDEO", "IMAGE"]).optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ assets: PortalAsset[]; allowDownload: boolean }> => {
    const { loadPortalAssets, readPortalSettings } = await import("@/lib/server/portal.server");
    const [assets, settings] = await Promise.all([
      loadPortalAssets(context.portal, data.kind ?? "ALL"),
      readPortalSettings(),
    ]);
    return { assets, allowDownload: settings.allowDownload };
  });

export const signPortalDownloadFn = createServerFn({ method: "POST" })
  .middleware([portalMiddleware])
  .validator((input: unknown) => z.object({ assetId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }): Promise<{ url: string }> => {
    const { signPortalDownload } = await import("@/lib/server/portal.server");
    return { url: await signPortalDownload(context.portal, data.assetId) };
  });

export const listPortalApprovalsFn = createServerFn({ method: "GET" })
  .middleware([portalMiddleware])
  .handler(async ({ context }): Promise<{ items: ApprovalRequest[]; canApprove: boolean }> => {
    const { loadPortalApprovals } = await import("@/lib/server/portal.server");
    return {
      items: await loadPortalApprovals(context.portal, "ALL"),
      canApprove: context.portal.canApprove && !context.portal.preview,
    };
  });

export const decidePortalApprovalFn = createServerFn({ method: "POST" })
  .middleware([portalMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        decision: z.enum(["APPROVED", "REJECTED"]),
        note: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    if (context.portal.preview) throw new Error("PORTAL_PREVIEW_READONLY");
    if (!context.portal.canApprove || !context.portal.userId) throw new Error("APPROVAL_FORBIDDEN");
    if (data.decision === "REJECTED" && !data.note?.trim()) throw new Error("PORTAL_NOTE_REQUIRED");
    const { getApprovalRequest, decideApproval } = await import("@/lib/server/approvals.server");
    const { assertClientFacingApproval, readPortalSettings } = await import("@/lib/server/portal.server");
    const settings = await readPortalSettings();
    if (!settings.approvalsEnabled) throw new Error("PORTAL_APPROVALS_OFF");
    const request = await getApprovalRequest(data.id);
    if (!request) throw new Error("APPROVAL_MISSING");
    assertClientFacingApproval(request, context.portal);
    const { portalActorId } = await import("@/lib/portal");
    const item = await decideApproval({
      id: data.id,
      actorId: portalActorId(context.portal.userId),
      decision: data.decision,
      note: data.note,
    });
    return { item };
  });

export const listPortalActivityFn = createServerFn({ method: "GET" })
  .middleware([portalMiddleware])
  .handler(async ({ context }): Promise<{ items: PortalActivityItem[] }> => {
    const { loadPortalActivity } = await import("@/lib/server/portal.server");
    return { items: await loadPortalActivity(context.portal) };
  });

export const markPortalNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([portalMiddleware])
  .handler(async ({ context }) => {
    const { markPortalNotificationsRead } = await import("@/lib/server/portal.server");
    await markPortalNotificationsRead(context.portal);
    return { ok: true as const };
  });
