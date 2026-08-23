import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getUserRole, requireAdmin, requireSecretEditor } from "@/lib/server/access";
import {
  LINEAR_ENTITY_TYPES,
  LINEAR_KANBAN_COLUMNS,
  type LinearFlags,
  type LinearLink,
  type LinearPublicStatus,
  type LinearStateMap,
} from "@/lib/linear";

async function requireMember(userId: string) {
  const role = await getUserRole(userId);
  if (!role) throw new Error("Forbidden");
  return role;
}

async function requireCreate(userId: string): Promise<void> {
  const role = await requireMember(userId);
  if (role === "admin") return;
  const { readLinearConfig } = await import("@/lib/server/linear.server");
  const config = await readLinearConfig();
  if (!config.flags.membersCanCreate) throw new Error("Forbidden");
}

export const getLinearStatusFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LinearPublicStatus> => {
    await requireMember(context.userId);
    const { publicLinearStatus, sweepLinearQueue } = await import("@/lib/server/linear.server");
    void sweepLinearQueue(4).catch(() => 0);
    return publicLinearStatus();
  });

export const saveLinearApiKeyFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ apiKey: z.string().trim().min(12).max(400) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { persistLinearApiKey } = await import("@/lib/server/linear.server");
    await persistLinearApiKey(data.apiKey);
    return { ok: true as const };
  });

export const saveLinearOauthAppFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ clientId: z.string().trim().min(8).max(200), clientSecret: z.string().trim().min(8).max(400) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { persistLinearOauthApp } = await import("@/lib/server/linear.server");
    await persistLinearOauthApp(data);
    return { ok: true as const };
  });

export const testLinearFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LinearPublicStatus> => {
    await requireSecretEditor(context.userId);
    const { testLinearConnection } = await import("@/lib/server/linear.server");
    try {
      const status = await testLinearConnection();
      try {
        const { onIntegrationChanged } = await import("@/lib/server/safety-hooks.server");
        await onIntegrationChanged({
          actorId: context.userId,
          provider: "linear",
          action: "connected",
        });
      } catch {
        /* */
      }
      return status;
    } catch (error) {
      const message = error instanceof Error ? error.message : "LINEAR_UNAVAILABLE";
      throw new Error(message);
    }
  });

export const loadLinearCatalogFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ teamId: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { loadLinearCatalog } = await import("@/lib/server/linear.server");
    return loadLinearCatalog(data.teamId);
  });

const BindingSchema = z.object({
  teamId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  stateMap: z
    .object({
      backlog: z.string().nullable().optional(),
      ready: z.string().nullable().optional(),
      inProgress: z.string().nullable().optional(),
      inReview: z.string().nullable().optional(),
      done: z.string().nullable().optional(),
    })
    .optional(),
  flags: z
    .object({
      enabled: z.boolean().optional(),
      syncJobs: z.boolean().optional(),
      autoIssueOnFail: z.boolean().optional(),
      autoIssueOnProposal: z.boolean().optional(),
      membersCanCreate: z.boolean().optional(),
      failColumn: z.enum(LINEAR_KANBAN_COLUMNS).optional(),
    })
    .optional(),
});

export const saveLinearBindingFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => BindingSchema.parse(input))
  .handler(async ({ context, data }): Promise<LinearPublicStatus> => {
    await requireAdmin(context.userId);
    const { saveLinearBinding } = await import("@/lib/server/linear.server");
    return saveLinearBinding({
      teamId: data.teamId,
      projectId: data.projectId,
      stateMap: data.stateMap as Partial<LinearStateMap> | undefined,
      flags: data.flags as Partial<LinearFlags> | undefined,
    });
  });

export const disconnectLinearFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { disconnectLinear } = await import("@/lib/server/linear.server");
    await disconnectLinear();
    try {
      const { onIntegrationChanged } = await import("@/lib/server/safety-hooks.server");
      await onIntegrationChanged({
        actorId: context.userId,
        provider: "linear",
        action: "disconnected",
      });
    } catch {
      /* */
    }
    return { ok: true as const };
  });

export const startLinearOAuthFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { startLinearOAuth } = await import("@/lib/server/linear.server");
    return startLinearOAuth(context.userId);
  });

export const ensureLinearMilestonesFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { ensureProjectMilestones } = await import("@/lib/server/linear.server");
    return { items: await ensureProjectMilestones() };
  });

const CreateIssueSchema = z.object({
  title: z.string().trim().min(3).max(250),
  description: z.string().max(8000).optional(),
  state: z.enum(LINEAR_KANBAN_COLUMNS).optional(),
  labels: z.array(z.string().max(40)).max(8).optional(),
  priority: z.number().int().min(0).max(4).optional(),
  entityType: z.enum(LINEAR_ENTITY_TYPES).optional(),
  entityId: z.string().max(80).optional(),
});

export const createLinearIssueFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => CreateIssueSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireCreate(context.userId);
    const { createLinearIssue } = await import("@/lib/server/linear.server");
    return createLinearIssue({
      title: data.title,
      description: data.description ?? null,
      state: data.state ?? "backlog",
      labels: data.labels ?? [],
      priority: data.priority ?? 0,
      linkTo: data.entityType && data.entityId ? { type: data.entityType, id: data.entityId } : null,
      actorId: context.userId,
    });
  });

export const getLinearLinkFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ entityType: z.enum(LINEAR_ENTITY_TYPES), entityId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ context, data }): Promise<LinearLink | null> => {
    await requireMember(context.userId);
    const { findLinearLink } = await import("@/lib/server/linear.server");
    return findLinearLink(data.entityType, data.entityId);
  });

export const listLinearLinksFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LinearLink[]> => {
    await requireMember(context.userId);
    const { listLinearLinks } = await import("@/lib/server/linear.server");
    return listLinearLinks();
  });
