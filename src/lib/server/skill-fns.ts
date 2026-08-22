import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export const listSkillsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { seedBuiltinSkills, readSkills, publicSkill } = await import("@/lib/server/skills.server");
    await seedBuiltinSkills();
    return (await readSkills()).map(publicSkill);
  });

export const getSkillFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { seedBuiltinSkills, getSkillById, publicSkill } = await import("@/lib/server/skills.server");
    await seedBuiltinSkills();
    const skill = await getSkillById(id);
    if (!skill) throw new Error("SKILL_MISSING");
    return publicSkill(skill);
  });

export const createSkillFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        skillMd: z.string().min(10).max(200_000),
        scripts: z.record(z.string(), z.string()).optional(),
        provenance: z.enum(["human", "agent"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/server/access");
    await requireAdmin(context.userId);
    const { createSkillInternal } = await import("@/lib/server/skills.server");
    return createSkillInternal({
      skillMd: data.skillMd,
      scripts: data.scripts,
      provenance: data.provenance === "agent" ? "agent" : "human",
      createdBy: context.userId,
    });
  });

export const setSkillEnabledFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string(), enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/server/access");
    await requireAdmin(context.userId);
    const { patchSkillInternal } = await import("@/lib/server/skills.server");
    await patchSkillInternal({ id: data.id, enabled: data.enabled });
    return { ok: true as const };
  });

export const approveSkillFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    const { requireAdmin } = await import("@/lib/server/access");
    await requireAdmin(context.userId);
    const { patchSkillInternal } = await import("@/lib/server/skills.server");
    await patchSkillInternal({ id, enabled: true, status: "active" });
    return { ok: true as const };
  });

export const invokeSkillFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string(),
        args: z.record(z.string(), z.any()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { getUserRole } = await import("@/lib/server/access");
    const role = await getUserRole(context.userId);
    if (role !== "admin" && role !== "member") throw new Error("Unauthorized");
    const { invokeSkillInternal } = await import("@/lib/server/skills.server");
    return invokeSkillInternal({
      skillId: data.id,
      args: data.args,
      actorId: context.userId,
    });
  });

export const listSkillRunsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { getSkillById, listSkillRunsForSkill } = await import("@/lib/server/skills.server");
    const skill = await getSkillById(id);
    if (!skill) throw new Error("SKILL_MISSING");
    return listSkillRunsForSkill(skill.id);
  });
