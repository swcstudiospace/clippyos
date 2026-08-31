/**
 * crayo.* tools for Agent / MCP. Never returns API keys.
 */
import { isCrayoMediaUrl } from "@/lib/agent-crayo";
import { sanitizeText } from "@/lib/sanitize";
import {
  CrayoApiError,
  crayoCreateAutoclip,
  crayoCreateProject,
  crayoExportProject,
  crayoGenerateImage,
  crayoGenerateVoiceover,
  crayoGetAccount,
  crayoGetAutoclip,
  crayoGetExport,
  crayoImportAsset,
  crayoListAssets,
  crayoListVoices,
  crayoPollExport,
} from "@/lib/server/crayo.server";
import { ingestFromUrl } from "@/lib/server/library-pipeline.server";

function str(payload: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function num(payload: Record<string, unknown>, key: string, fallback: number, min: number, max: number): number {
  const raw = Number(payload[key]);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

function pickField(value: unknown, field: string): string {
  if (!value) return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = pickField(item, field);
      if (found) return found;
    }
    return "";
  }
  if (typeof value !== "object") return "";
  const rec = value as Record<string, unknown>;
  const direct = rec[field];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (typeof direct === "number" && Number.isFinite(direct)) return String(direct);
  for (const nested of Object.values(rec)) {
    const found = pickField(nested, field);
    if (found) return found;
  }
  return "";
}

function firstHttps(value: unknown): string {
  if (typeof value === "string" && value.startsWith("https://")) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstHttps(item);
      if (found) return found;
    }
    return "";
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const found = firstHttps(nested);
      if (found) return found;
    }
  }
  return "";
}

async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof CrayoApiError) throw new Error(error.code);
    throw error;
  }
}

async function ingestCrayoMedia(
  actorId: string,
  clientId: string | null,
  url: string,
  title: string,
  extraTags: string[],
): Promise<{ assetId: string; title: string; status: string; kind: string; duplicate: boolean } | { error: string; url: string } | null> {
  if (!url.startsWith("https://")) return null;
  if (!isCrayoMediaUrl(url)) return { error: "UNTRUSTED_URL", url };
  try {
    const { asset, duplicate } = await ingestFromUrl({
      actorId,
      clientId,
      url,
      title,
      source: "AGENT",
      tags: ["crayo", "agent", ...extraTags],
    });
    return {
      assetId: asset.id,
      title: asset.title,
      status: asset.status,
      kind: asset.kind,
      duplicate,
    };
  } catch {
    return { error: "INGEST_FAILED", url };
  }
}

async function crayoPollAutoclip(id: string): Promise<unknown> {
  const max = 60;
  for (let i = 0; i < max; i += 1) {
    const payload = await crayoGetAutoclip(id);
    const status = pickField(payload, "status").toLowerCase();
    if (status === "completed" || status === "complete" || status === "succeeded") return payload;
    if (status === "failed" || status === "error") throw new CrayoApiError("FAILED", "Crayo AutoClip failed.", 400);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new CrayoApiError("TIMEOUT", "Crayo AutoClip is still processing.", 504);
}

async function runShort(payload: Record<string, unknown>, actorId: string): Promise<unknown> {
  const prompt = sanitizeText(str(payload, "prompt", "topic")).slice(0, 2000);
  const script = sanitizeText(str(payload, "script")).slice(0, 5000) || prompt;
  const title = sanitizeText(str(payload, "title")).slice(0, 80) || prompt.slice(0, 80) || "Crayo short";
  const clientId = str(payload, "clientId") || null;
  if (!prompt) throw new Error("VALIDATION");

  await wrap(() => crayoGetAccount());
  const voices = await wrap(() => crayoListVoices({ limit: 10 }));
  const voiceId = pickField(voices, "voice_id") || pickField(voices, "id");
  if (!voiceId) throw new Error("CRAYO_FAILED");

  const image = await wrap(() => crayoGenerateImage({ prompt, aspectRatio: "9:16" }));
  const imageId = pickField(image, "id") || pickField(image, "asset_id");
  const imageUrl = firstHttps(image);

  const voice = await wrap(() =>
    crayoGenerateVoiceover({
      script,
      voiceId,
      title: title.slice(0, 25),
    }),
  );
  const audioId = pickField(voice, "id") || pickField(voice, "asset_id");
  const durationSec = Number(pickField(voice, "duration_seconds") || pickField(voice, "duration")) || 15;
  const endMs = Math.min(60_000, Math.max(4_000, Math.round(durationSec * 1000)));
  if (!imageId || !audioId) throw new Error("CRAYO_FAILED");

  const project = await wrap(() =>
    crayoCreateProject({
      title,
      aspect_ratio: "9:16",
      scenes: [
        {
          asset_id: imageId,
          start_ms: 0,
          end_ms: endMs,
          narration: { asset_id: audioId },
        },
      ],
    }),
  );
  const projectId = pickField(project, "id");
  if (!projectId) throw new Error("CRAYO_FAILED");

  const queued = await wrap(() => crayoExportProject(projectId));
  const exportId = pickField(queued, "id");
  const exported = exportId ? await wrap(() => crayoPollExport(exportId)).catch(() => queued) : queued;
  const videoUrl = firstHttps(exported) || firstHttps(queued);

  const library = videoUrl
    ? await ingestCrayoMedia(actorId, clientId, videoUrl, title, ["short"])
    : null;
  const still = imageUrl
    ? await ingestCrayoMedia(actorId, clientId, imageUrl, `${title} still`, ["short", "still"])
    : null;

  return {
    projectId,
    exportId: exportId || null,
    videoUrl: videoUrl || null,
    thumbnailUrl: imageUrl || null,
    library,
    still,
    durationSeconds: durationSec,
  };
}

async function runAutoclip(payload: Record<string, unknown>, actorId: string): Promise<unknown> {
  const url = str(payload, "url");
  const clientId = str(payload, "clientId") || null;
  if (!url.startsWith("https://")) throw new Error("VALIDATION");
  const imported = await wrap(() =>
    crayoImportAsset({
      url,
      name: sanitizeText(str(payload, "name")).slice(0, 200) || undefined,
    }),
  );
  const assetId = pickField(imported, "id") || pickField(imported, "asset_id");
  if (!assetId) throw new Error("CRAYO_FAILED");

  const job = await wrap(() =>
    crayoCreateAutoclip({
      assetId,
      clipCount: num(payload, "clipCount", 5, 2, 20),
      clipLength: num(payload, "clipLength", 60, 30, 90),
      editLevel: str(payload, "editLevel", "edit_level") || "full",
      prompt: sanitizeText(str(payload, "prompt")).slice(0, 500) || undefined,
    }),
  );
  const autoclipId = pickField(job, "id");
  if (!autoclipId) throw new Error("CRAYO_FAILED");

  const finished = await wrap(() => crayoPollAutoclip(autoclipId));
  const clipsRaw =
    finished && typeof finished === "object" && Array.isArray((finished as { clips?: unknown }).clips)
      ? ((finished as { clips: unknown[] }).clips)
      : [];
  const clips = [];
  for (const clip of clipsRaw.slice(0, 20)) {
    const title = pickField(clip, "title") || "AutoClip";
    const thumbnailUrl = pickField(clip, "thumbnail_url") || firstHttps(clip);
    const projectId = pickField(clip, "project_id") || pickField(clip, "id");
    const library = thumbnailUrl
      ? await ingestCrayoMedia(actorId, clientId, thumbnailUrl, title, ["autoclip"])
      : null;
    clips.push({
      title,
      projectId: projectId || null,
      thumbnailUrl: thumbnailUrl || null,
      library,
    });
  }
  return { autoclipId, assetId, clips };
}

export async function handleCrayoAction(
  action: string,
  payload: Record<string, unknown>,
  actorId: string,
): Promise<unknown> {
  switch (action) {
    case "crayo.get_account":
      return wrap(() => crayoGetAccount());
    case "crayo.list_assets":
      return wrap(() =>
        crayoListAssets({
          type: str(payload, "type") || undefined,
          limit: num(payload, "limit", 20, 1, 100),
        }),
      );
    case "crayo.list_voices":
      return wrap(() =>
        crayoListVoices({
          search: str(payload, "search") || undefined,
          limit: num(payload, "limit", 20, 1, 100),
        }),
      );
    case "crayo.import_asset": {
      const url = str(payload, "url");
      if (!url.startsWith("https://")) throw new Error("VALIDATION");
      return wrap(() => crayoImportAsset({ url, name: sanitizeText(str(payload, "name")).slice(0, 200) || undefined }));
    }
    case "crayo.generate_image": {
      const prompt = sanitizeText(str(payload, "prompt")).slice(0, 2000);
      const clientId = str(payload, "clientId") || null;
      if (!prompt) throw new Error("VALIDATION");
      const image = await wrap(() =>
        crayoGenerateImage({
          prompt,
          aspectRatio: str(payload, "aspectRatio", "aspect_ratio") || "9:16",
          model: str(payload, "model") || undefined,
        }),
      );
      const imageUrl = firstHttps(image);
      const library = imageUrl
        ? await ingestCrayoMedia(actorId, clientId, imageUrl, prompt.slice(0, 80) || "Crayo still", ["still"])
        : null;
      return { image, thumbnailUrl: imageUrl || null, library };
    }
    case "crayo.generate_voiceover": {
      const script = sanitizeText(str(payload, "script")).slice(0, 5000);
      const voiceId = str(payload, "voiceId", "voice_id");
      const clientId = str(payload, "clientId") || null;
      if (!script || !voiceId) throw new Error("VALIDATION");
      const voice = await wrap(() =>
        crayoGenerateVoiceover({
          script,
          voiceId,
          title: sanitizeText(str(payload, "title")).slice(0, 25) || undefined,
        }),
      );
      const audioUrl = firstHttps(voice);
      const library = audioUrl
        ? await ingestCrayoMedia(actorId, clientId, audioUrl, script.slice(0, 80) || "Crayo voiceover", [
            "voiceover",
          ])
        : null;
      return { voice, audioUrl: audioUrl || null, library };
    }
    case "crayo.create_project": {
      const title = sanitizeText(str(payload, "title")).slice(0, 200);
      const scenes = payload.scenes;
      if (!title || !Array.isArray(scenes) || scenes.length === 0) throw new Error("VALIDATION");
      return wrap(() => crayoCreateProject({ ...payload, title }));
    }
    case "crayo.export_project": {
      const id = str(payload, "projectId", "id");
      if (!id) throw new Error("VALIDATION");
      const queued = await wrap(() => crayoExportProject(id));
      const exportId = pickField(queued, "id");
      if (!exportId) return queued;
      try {
        return await wrap(() => crayoPollExport(exportId));
      } catch {
        return queued;
      }
    }
    case "crayo.get_export": {
      const id = str(payload, "exportId", "id");
      if (!id) throw new Error("VALIDATION");
      return wrap(() => crayoGetExport(id));
    }
    case "crayo.create_autoclip": {
      const assetId = str(payload, "assetId", "asset_id");
      if (!assetId) throw new Error("VALIDATION");
      return wrap(() =>
        crayoCreateAutoclip({
          assetId,
          clipCount: num(payload, "clipCount", 5, 2, 20),
          clipLength: num(payload, "clipLength", 60, 30, 90),
          editLevel: str(payload, "editLevel", "edit_level") || "full",
          prompt: sanitizeText(str(payload, "prompt")).slice(0, 500) || undefined,
        }),
      );
    }
    case "crayo.get_autoclip": {
      const id = str(payload, "autoclipId", "id");
      if (!id) throw new Error("VALIDATION");
      return wrap(() => crayoGetAutoclip(id));
    }
    case "crayo.ingest_to_library": {
      const url = str(payload, "url");
      const title = sanitizeText(str(payload, "title")).slice(0, 200) || "Crayo asset";
      const clientId = str(payload, "clientId") || null;
      if (!url.startsWith("https://")) throw new Error("VALIDATION");
      const result = await ingestCrayoMedia(actorId, clientId, url, title, []);
      if (!result || "error" in result) throw new Error(result?.error ?? "INGEST_FAILED");
      return result;
    }
    case "crayo.run_short":
      return runShort(payload, actorId);
    case "crayo.run_autoclip":
      return runAutoclip(payload, actorId);
    default:
      return undefined;
  }
}
