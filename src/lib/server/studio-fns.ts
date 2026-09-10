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

export type CrayoAccountSnapshot = {
  configured: boolean;
  plan: string | null;
  credits: { export: number; voiceover: number; image: number; video: number } | null;
  error: string | null;
};

export const crayoAccountFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CrayoAccountSnapshot> => {
    await requireUser(context.userId);
    const crayo = await import("@/lib/server/crayo.server");
    if (!(await crayo.crayoAvailable())) {
      return { configured: false, plan: null, credits: null, error: null };
    }
    try {
      const raw = await crayo.crayoGetAccount();
      const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      const account = row.account && typeof row.account === "object" ? (row.account as Record<string, unknown>) : row;
      const creditsRaw = row.credits && typeof row.credits === "object" ? (row.credits as Record<string, unknown>) : {};
      const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
      const plan = typeof account.plan === "string" ? account.plan : null;
      return {
        configured: true,
        plan,
        credits: {
          export: num(creditsRaw.export),
          voiceover: num(creditsRaw.voiceover),
          image: num(creditsRaw.image),
          video: num(creditsRaw.video),
        },
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "CRAYO_FAILED";
      return { configured: true, plan: null, credits: null, error: message.slice(0, 120) };
    }
  });

export const hermesConnectFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireUser(context.userId);
    const { buildConnectStatus } = await import("@/lib/server/hermes-connect.server");
    return buildConnectStatus();
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

export type CrayoVoiceOption = { id: string; name: string };
export type CrayoAssetOption = { id: string; name: string; type: string };

function pickString(value: unknown, ...keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const rec = value as Record<string, unknown>;
  for (const key of keys) {
    const direct = rec[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
  }
  return "";
}

function asRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    for (const key of ["voices", "assets", "data", "items", "results"]) {
      if (Array.isArray(rec[key])) return rec[key] as unknown[];
    }
  }
  return [];
}

export const crayoListVoicesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ ok: true; voices: CrayoVoiceOption[] } | { ok: false; error: string }> => {
    await requireUser(context.userId);
    const crayo = await import("@/lib/server/crayo.server");
    if (!(await crayo.crayoAvailable())) return { ok: false, error: "MISSING" };
    try {
      const raw = await crayo.crayoListVoices({ limit: 40 });
      const voices: CrayoVoiceOption[] = [];
      for (const row of asRows(raw)) {
        const id = pickString(row, "voice_id", "id");
        if (!id) continue;
        voices.push({ id, name: pickString(row, "name", "label", "title") || id });
      }
      return { ok: true, voices };
    } catch (error) {
      const message = error instanceof Error ? error.message : "CRAYO_FAILED";
      return { ok: false, error: message.slice(0, 80) };
    }
  });

export const crayoListAssetsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ ok: true; assets: CrayoAssetOption[] } | { ok: false; error: string }> => {
    await requireUser(context.userId);
    const crayo = await import("@/lib/server/crayo.server");
    if (!(await crayo.crayoAvailable())) return { ok: false, error: "MISSING" };
    try {
      const raw = await crayo.crayoListAssets({ limit: 40 });
      const assets: CrayoAssetOption[] = [];
      for (const row of asRows(raw)) {
        const id = pickString(row, "id", "asset_id");
        if (!id) continue;
        assets.push({
          id,
          name: pickString(row, "name", "title") || id,
          type: pickString(row, "type", "kind") || "file",
        });
      }
      return { ok: true, assets };
    } catch (error) {
      const message = error instanceof Error ? error.message : "CRAYO_FAILED";
      return { ok: false, error: message.slice(0, 80) };
    }
  });
