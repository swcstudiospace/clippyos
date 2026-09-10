/** Clipping tab server functions — Social Machine cockpit + machine-drop ingest. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/access";
import {
  checkCrayoLogin,
  clippingSnapshot,
  ingestDrop,
  listClippingProcedureSkills,
  listDrops,
  runClippingProcedureSkill,
  startClippingSession as startClippingSessionServer,
  stopClippingSession as stopClippingSessionServer,
  type ClippingProcedureSkillSummary,
  type ClippingSnapshot,
  type CrayoLoginCheck,
} from "@/lib/server/clipping.server";
import type { MachineDrop } from "@/lib/server/storage-bridge.server";

export type { ClippingSnapshot };
export type { MachineDrop };

const OpenUrlSchema = z.object({
  openUrl: z.string().url().optional(),
});

const DropIdSchema = z.object({
  dropId: z.string().min(1),
});

export const getClippingSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ClippingSnapshot> => {
    return clippingSnapshot(context.userId);
  });

export const startClippingSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => OpenUrlSchema.parse(input))
  .handler(async ({ context, data }): Promise<ClippingSnapshot> => {
    await requireAdmin(context.userId);
    return startClippingSessionServer(context.userId, data.openUrl);
  });

export const stopClippingSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ClippingSnapshot> => {
    await requireAdmin(context.userId);
    return stopClippingSessionServer(context.userId);
  });

export const listClippingDrops = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<MachineDrop[]> => {
    return listDrops();
  });

export const ingestClippingDrop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => DropIdSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ assetId: string; duplicate: boolean }> => {
    await requireAdmin(context.userId);
    return ingestDrop(context.userId, data.dropId);
  });

/** Guided human-in-loop crayo.io login probe. Never auto-starts the VM. */
export const checkCrayoLoginFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CrayoLoginCheck> => {
    await requireAdmin(context.userId);
    return checkCrayoLogin();
  });

export const listClippingProcedureSkillsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<ClippingProcedureSkillSummary[]> => {
    return listClippingProcedureSkills();
  });

const ProcedureSlugSchema = z.object({
  slug: z.string().min(1),
});

/** Replay an approved browser-procedure skill's stored steps right now. */
export const runClippingProcedureSkillFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => ProcedureSlugSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return runClippingProcedureSkill({ slug: data.slug, actorId: context.userId });
  });
