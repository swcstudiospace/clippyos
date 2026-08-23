import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getUserRole, requireAdmin } from "@/lib/server/access";
import { HEALTH_JOB_TYPES, HEALTH_QUERY_KEY } from "@/lib/health";

export { HEALTH_QUERY_KEY };

const TypeSchema = z.enum(HEALTH_JOB_TYPES);
const JobRefSchema = z.object({
  type: TypeSchema,
  id: z.string().trim().min(1).max(80),
});

async function requireUser(userId: string) {
  const role = await getUserRole(userId);
  if (!role) throw new Error("Forbidden");
  return role;
}

export const getHealthSnapshotFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await requireUser(context.userId);
    const { buildHealthSnapshot } = await import("@/lib/server/health.server");
    return buildHealthSnapshot({ userId: context.userId, role });
  });

export const retryHealthJobFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => JobRefSchema.parse(input))
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    const { retryHealthJob } = await import("@/lib/server/health.server");
    return retryHealthJob({
      actorId: context.userId,
      type: data.type,
      id: data.id,
      isAdmin: role === "admin",
    });
  });

export const cancelHealthJobFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => JobRefSchema.parse(input))
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    const { cancelHealthJob } = await import("@/lib/server/health.server");
    return cancelHealthJob({
      actorId: context.userId,
      type: data.type,
      id: data.id,
      isAdmin: role === "admin",
    });
  });

export const dismissDlqJobFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => JobRefSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { dismissDlqJob } = await import("@/lib/server/health.server");
    await dismissDlqJob(data);
    return { ok: true as const };
  });

export const createLinearFromFailFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => JobRefSchema.parse(input))
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const { createLinearFromFail } = await import("@/lib/server/health.server");
    return createLinearFromFail({
      actorId: context.userId,
      type: data.type,
      id: data.id,
      isAdmin: true,
    });
  });
