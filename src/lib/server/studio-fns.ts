/** Studio server functions — Crayo.ai short-form video + thumbnail generation. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

async function requireUser(userId: string) {
  const { getUserRole } = await import("@/lib/server/access");
  const role = await getUserRole(userId);
  if (!role) throw new Error("Forbidden");
  return role;
}

const CrayoGenerateSchema = z.object({
  prompt: z.string().max(2000).optional(),
  script: z.string().max(20000).optional(),
  articleUrl: z.string().url().max(2000).optional(),
  style: z.string().max(40).optional(),
  duration: z.number().int().min(15).max(180).optional(),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).optional(),
});

export type CrayoGenerateInput = z.infer<typeof CrayoGenerateSchema>;

export type CrayoStudioResult =
  | { ok: true; videoUrl: string; jobId: string; assetId?: string }
  | { ok: false; error: "missing" | "rate_limit" | "timeout" | "failed" | "processing" };

export const generateCrayoVideoFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => CrayoGenerateSchema.parse(input))
  .handler(async ({ context, data }): Promise<CrayoStudioResult> => {
    await requireUser(context.userId);
    const { generateCrayoVideo } = await import("@/lib/server/crayo.server");
    const result = await generateCrayoVideo(data);

    // Best-effort ingest of a generated video into the Library.
    if (result.ok && result.videoUrl) {
      try {
        const { ingestFromUrl } = await import("@/lib/server/library-pipeline.server");
        const ingested = await ingestFromUrl({
          actorId: context.userId,
          clientId: null,
          url: result.videoUrl,
          title: `Crayo short · ${new Date().toISOString().slice(0, 10)}`,
          source: "URL_IMPORT",
          tags: ["crayo", "short-form"],
        });
        return { ...result, assetId: ingested.asset.id };
      } catch {
        /* library ingest is best-effort */
        return result;
      }
    }
    return result;
  });

export const crayoStatusFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireUser(context.userId);
    const { crayoAvailable } = await import("@/lib/server/crayo.server");
    return crayoAvailable();
  });

const ThumbnailGenerateSchema = z.object({
  prompt: z.string().min(1).max(3500),
  clientId: z.string().nullable().optional(),
});

export type ThumbnailStudioResult =
  | { ok: true; url: string; assetId?: string }
  | { ok: false; error: "missing" | "rate_limit" | "timeout" | "failed" };

export const generateStudioThumbnailFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => ThumbnailGenerateSchema.parse(input))
  .handler(async ({ context, data }): Promise<ThumbnailStudioResult> => {
    await requireUser(context.userId);
    const { generateThumbnailImage } = await import("@/lib/server/higgsfield.server");
    const result = await generateThumbnailImage(data.prompt);

    // Best-effort ingest of a generated thumbnail into the Library.
    if (result.ok && result.url) {
      try {
        const { ingestFromUrl } = await import("@/lib/server/library-pipeline.server");
        let clientName: string | null = null;
        if (data.clientId) {
          const { readClients } = await import("@/lib/server/clients");
          const clients = await readClients();
          clientName = clients.find((row) => row.id === data.clientId)?.name ?? null;
        }
        const ingested = await ingestFromUrl({
          actorId: context.userId,
          clientId: data.clientId ?? null,
          url: result.url,
          title: `Thumbnail${clientName ? ` · ${clientName}` : ""} · ${new Date().toISOString().slice(0, 10)}`,
          source: "THUMBNAIL_GEN",
          tags: ["thumbnail", "studio"],
        });
        return { ...result, assetId: ingested.asset.id };
      } catch {
        /* library ingest is best-effort */
        return result;
      }
    }
    return result;
  });

export const imageGenStatusFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireUser(context.userId);
    const { imageGenAvailable } = await import("@/lib/server/higgsfield.server");
    return imageGenAvailable();
  });
