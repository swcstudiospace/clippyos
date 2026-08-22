import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin, getUserRole } from "@/lib/server/access";
import { parsePortalSettings, type PortalSettings, type PortalUserPublic } from "@/lib/portal";

async function requireStaff(userId: string) {
  const role = await getUserRole(userId);
  if (!role) throw new Error("Forbidden");
  return role;
}

export const getPortalSettingsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<PortalSettings> => {
    await requireStaff(context.userId);
    const { readPortalSettings } = await import("@/lib/server/portal.server");
    return readPortalSettings();
  });

export const savePortalSettingsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        enabled: z.boolean(),
        allowDownload: z.boolean(),
        showMetrics: z.boolean(),
        approvalsEnabled: z.boolean(),
        welcomeBlurb: z.string().max(400),
        agencyName: z.string().max(80),
        logoUrl: z.string().max(500).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { writePortalSettings } = await import("@/lib/server/portal.server");
    const { writeAuditEvent } = await import("@/lib/server/audit.server");
    const next = await writePortalSettings(parsePortalSettings(data));
    await writeAuditEvent({
      actorUserId: context.userId,
      actorType: "USER",
      action: "settings.portal.updated",
      entityType: "app_setting",
      entityId: "PORTAL_SETTINGS_JSON",
      summary: "Updated client portal settings",
    });
    return next;
  });

export const listPortalUsersFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ clientId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }): Promise<{ users: PortalUserPublic[]; workingOn: string | null }> => {
    await requireStaff(context.userId);
    const { listPortalUsers, readClientWorkingOn } = await import("@/lib/server/portal.server");
    const [users, workingOn] = await Promise.all([
      listPortalUsers(data.clientId),
      readClientWorkingOn(data.clientId),
    ]);
    return { users, workingOn };
  });

export const invitePortalUserFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        clientId: z.string().min(1),
        email: z.string().email().max(200),
        name: z.string().max(80).optional(),
        canApprove: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const { invitePortalUser } = await import("@/lib/server/portal.server");
    return invitePortalUser({
      clientId: data.clientId,
      email: data.email,
      name: data.name,
      canApprove: data.canApprove,
      actorId: context.userId,
    });
  });

export const revokePortalUserFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const { revokePortalUser } = await import("@/lib/server/portal.server");
    return revokePortalUser({ id: data.id, actorId: context.userId });
  });

export const setPortalCanApproveFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string().min(1), canApprove: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const { setPortalCanApprove } = await import("@/lib/server/portal.server");
    return setPortalCanApprove({ id: data.id, canApprove: data.canApprove, actorId: context.userId });
  });

export const savePortalWorkingOnFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ clientId: z.string().min(1), note: z.string().max(280).nullable() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const { writeClientWorkingOn } = await import("@/lib/server/portal.server");
    await writeClientWorkingOn(data.clientId, data.note);
    return { ok: true as const };
  });

export const startPortalPreviewFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ clientId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { startPortalPreview } = await import("@/lib/server/portal.server");
    return startPortalPreview({ clientId: data.clientId, actorId: context.userId });
  });
