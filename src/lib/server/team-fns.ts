import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getUserRole, requireAdmin } from "@/lib/server/access";
import {
  AUTOMATION_KINDS,
  AUTOMATION_RUNTIME_HINTS,
  BOT_ROLE_KEYS,
  HUMAN_ROLES,
} from "@/lib/entities";
import { TEAM_QUERY_KEY } from "@/lib/team";

export { TEAM_QUERY_KEY };

const KindSchema = z.enum(AUTOMATION_KINDS);
const RoleSchema = z.enum(BOT_ROLE_KEYS);
const RuntimeSchema = z.enum(AUTOMATION_RUNTIME_HINTS);

const SeatSchema = z.object({
  botLabel: z.string().trim().min(1).max(80),
  automationKind: KindSchema.optional(),
  botRoleKey: RoleSchema.optional(),
  runtimeHint: RuntimeSchema.optional(),
  mcpTokenId: z.string().trim().min(1).max(80).nullable().optional(),
  cost: z.number().min(0).max(100000).optional(),
  notes: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  assignedClientIds: z.array(z.string().min(1)).max(40).optional(),
});

async function audit(input: {
  actorId: string;
  action: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { writeAuditEvent } = await import("@/lib/server/audit.server");
    await writeAuditEvent({
      actorUserId: input.actorId,
      actorType: "USER",
      action: input.action,
      entityType: "team_member",
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata,
    });
  } catch {
    /* optional */
  }
}

export const getTeamSnapshotFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const team = await import("@/lib/server/team.server");
    const money = await import("@/lib/server/money");
    const [clients, members, settings, tokens, role] = await Promise.all([
      money.readClients(),
      team.readTeamMembersInternal(),
      team.readTeamSettings(),
      team.listLinkableTokens(),
      getUserRole(context.userId),
    ]);
    return { clients, teamMembers: members, settings, tokens, role };
  });

export const saveTeamSettingsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        showAiTeammates: z.boolean().optional(),
        includeAutomationCostInMargin: z.boolean().optional(),
        grokBotRosterNotes: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    return team.writeTeamSettings(data);
  });

export const createAiTeammateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => SeatSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    const member = await team.createAutomationSeat(data, context.userId);
    await audit({
      actorId: context.userId,
      action: "team.automation.created",
      entityId: member.id,
      summary: `Added AI teammate ${member.botLabel ?? member.name}`,
      metadata: { botRoleKey: member.botRoleKey, automationKind: member.automationKind },
    });
    return member;
  });

export const updateAiTeammateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => SeatSchema.extend({ id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    const { id, ...patch } = data;
    const member = await team.patchAutomationSeat(id, patch, context.userId);
    await audit({
      actorId: context.userId,
      action: "team.automation.updated",
      entityId: member.id,
      summary: `Updated AI teammate ${member.botLabel ?? member.name}`,
    });
    return member;
  });

export const setAiTeammateActiveFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string().min(1), isActive: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    const member = await team.setAutomationActive(data.id, data.isActive, context.userId);
    await audit({
      actorId: context.userId,
      action: data.isActive ? "team.automation.enabled" : "team.automation.disabled",
      entityId: member.id,
      summary: `${data.isActive ? "Enabled" : "Disabled"} ${member.botLabel ?? member.name}`,
    });
    return member;
  });

export const linkAiTeammateTokenFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string().min(1), mcpTokenId: z.string().min(1).max(80).nullable() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    const member = await team.linkAutomationToken(data.id, data.mcpTokenId, context.userId);
    await audit({
      actorId: context.userId,
      action: "team.automation.linked_token",
      entityId: member.id,
      summary: data.mcpTokenId
        ? `Linked MCP token to ${member.botLabel ?? member.name}`
        : `Unlinked MCP token from ${member.botLabel ?? member.name}`,
      metadata: { mcpTokenId: data.mcpTokenId, mcpTokenLabel: member.mcpTokenLabel },
    });
    return member;
  });

export const removeAiTeammateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    await team.removeAutomationSeat(id, context.userId);
    await audit({
      actorId: context.userId,
      action: "team.automation.removed",
      entityId: id,
      summary: "Removed AI teammate",
    });
    return { ok: true as const };
  });

const HumanSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.enum(HUMAN_ROLES),
  clientId: z.string().trim().min(1).max(80),
  cost: z.number().min(0).max(100000).optional(),
  notes: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createHumanSeatFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => HumanSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    const member = await team.createHumanSeat(data, context.userId);
    await audit({
      actorId: context.userId,
      action: "team.human.created",
      entityId: member.id,
      summary: `Assigned ${member.name} as ${member.role}`,
      metadata: { clientId: member.clientId, role: member.role },
    });
    return member;
  });

export const updateHumanSeatFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => HumanSchema.extend({ id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    const { id, ...patch } = data;
    const member = await team.patchHumanSeat(id, patch, context.userId);
    await audit({
      actorId: context.userId,
      action: "team.human.updated",
      entityId: member.id,
      summary: `Updated ${member.name}`,
    });
    return member;
  });

export const removeHumanSeatFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const team = await import("@/lib/server/team.server");
    await team.removeHumanSeat(id, context.userId);
    await audit({
      actorId: context.userId,
      action: "team.human.removed",
      entityId: id,
      summary: "Removed human teammate",
    });
    return { ok: true as const };
  });
