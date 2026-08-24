/** Clipping tab server functions — Social Machine cockpit + machine-drop ingest. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/access";
import {
  clippingSnapshot,
  ingestDrop,
  listDrops,
  startClippingSession as startClippingSessionServer,
  stopClippingSession as stopClippingSessionServer,
  type ClippingSnapshot,
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
