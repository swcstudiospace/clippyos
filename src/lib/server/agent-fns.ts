import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { normalizePreset } from "@/lib/agent";

export const listAgentRunsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { listAgentRuns } = await import("@/lib/server/agent.server");
    return listAgentRuns(40);
  });

export const getAgentRunFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { getAgentRunDetail } = await import("@/lib/server/agent.server");
    const detail = await getAgentRunDetail(id);
    if (!detail) throw new Error("JOB_MISSING");
    return detail;
  });

export const startAgentRunFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        goal: z.string().max(4000),
        preset: z.string().min(1),
        clientId: z.string().nullable().optional(),
        skillId: z.string().nullable().optional(),
        idempotencyKey: z.string().max(80).nullable().optional(),
        modelOverride: z.string().max(80).nullable().optional(),
        runner: z.enum(["local", "grok_bot"]).optional(),
        triggeredByTeamMemberId: z.string().min(1).max(80).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { startAgentRun } = await import("@/lib/server/agent-loop.server");
    return startAgentRun({
      goal: data.goal,
      preset: normalizePreset(data.preset),
      clientId: data.clientId,
      skillId: data.skillId,
      createdBy: context.userId,
      idempotencyKey: data.idempotencyKey,
      modelOverride: data.modelOverride,
      runner: data.runner ?? "local",
      triggeredByTeamMemberId: data.triggeredByTeamMemberId ?? null,
    });
  });

export const cancelAgentRunFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { cancelAgentRun } = await import("@/lib/server/agent-loop.server");
    await cancelAgentRun(id);
    return { ok: true as const };
  });
