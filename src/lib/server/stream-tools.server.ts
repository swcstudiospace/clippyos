/**
 * stream.* + bridge.* tools for Agent / MCP / API — Hermes-facing control
 * surface for clipping streams via the Social Machine.
 *
 * Stream clip records are created/patched here; the actual recording happens
 * on the Social Machine (Computer Use), which drops finished files into the
 * shared bucket's machine-drops/ prefix. The dashboard side ingests from there.
 * Never returns storage keys or signing secrets.
 */
import { sanitizeText } from "@/lib/sanitize";
import { clampClipCount, clampClipDuration } from "@/lib/stream";
import { getVodById, insertStreamClip, listClipsForClient, listVodsForClient, patchStreamClip } from "@/lib/server/stream.server";
import { getAsset, listAssets } from "@/lib/server/library.server";

function str(payload: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function num(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function handleStreamAction(
  action: string,
  payload: Record<string, unknown>,
  actorId: string,
): Promise<unknown> {
  switch (action) {
    case "stream.list_sources": {
      const { readStreamSources } = await import("@/lib/server/stream.server");
      const clientId = str(payload, "clientId") || undefined;
      const sources = await readStreamSources(clientId);
      return {
        sources: sources.map((row) => ({
          id: row.id,
          clientId: row.clientId,
          platform: row.platform,
          login: row.login,
          displayName: row.displayName,
          status: row.status,
        })),
      };
    }
    case "stream.list_vods": {
      const clientId = str(payload, "clientId");
      if (!clientId) throw new Error("VALIDATION");
      const vods = await listVodsForClient(clientId);
      return {
        vods: vods.map((row) => ({
          id: row.id,
          title: row.title,
          url: row.url,
          durationSec: row.durationSec,
          viewCount: row.viewCount,
          publishedAt: row.publishedAt,
        })),
      };
    }
    case "stream.list_clips": {
      const vodId = str(payload, "vodId");
      const clientId = str(payload, "clientId");
      const clips = vodId
        ? await (async () => {
            const { listClipsForVod } = await import("@/lib/server/stream.server");
            return listClipsForVod(vodId);
          })()
        : clientId
          ? await listClipsForClient(clientId)
          : [];
      return {
        clips: clips.map((row) => ({
          id: row.id,
          vodId: row.vodId,
          clientId: row.clientId,
          title: row.title,
          caption: row.caption,
          notes: row.notes,
          vodOffsetSec: row.vodOffsetSec,
          durationSec: row.durationSec,
          status: row.status,
          error: row.error,
        })),
      };
    }
    case "stream.plan_clips": {
      // Deterministic offset plan an agent can hand to Computer Use.
      const vodId = str(payload, "vodId");
      if (!vodId) throw new Error("VALIDATION");
      const vod = await getVodById(vodId);
      if (!vod) throw new Error("ASSET_MISSING");
      const count = clampClipCount(payload.clipCount ?? 5);
      const durationSec = clampClipDuration(payload.durationSec ?? 30);
      const { proposeEvenOffsets } = await import("@/lib/stream");
      const offsets = proposeEvenOffsets(vod.durationSec, count, durationSec);
      return {
        vodId,
        vodTitle: vod.title,
        vodDurationSec: vod.durationSec,
        plan: offsets.map((row, index) => ({
          index: index + 1,
          startSec: Math.max(0, row.vodOffsetSec - row.durationSec),
          endSec: row.vodOffsetSec,
          durationSec: row.durationSec,
          suggestedTitle: `${vod.title} — part ${index + 1}`,
        })),
      };
    }
    case "stream.create_clip": {
      const vodId = str(payload, "vodId");
      if (!vodId) throw new Error("VALIDATION");
      const vod = await getVodById(vodId);
      if (!vod) throw new Error("ASSET_MISSING");
      const endOffset = num(payload.vodOffsetSec);
      if (endOffset == null || endOffset <= 0) throw new Error("VALIDATION");
      const durationSec = clampClipDuration(payload.durationSec ?? 30);
      const clip = await insertStreamClip({
        vodId,
        clientId: vod.clientId,
        vodOffsetSec: endOffset,
        durationSec,
        title: sanitizeText(str(payload, "title") || `${vod.title} — clip`).slice(0, 160),
        createdBy: actorId,
      });
      return { clipId: clip.id, status: clip.status, vodOffsetSec: clip.vodOffsetSec, durationSec: clip.durationSec };
    }
    case "stream.update_clip": {
      const id = str(payload, "clipId", "id");
      if (!id) throw new Error("VALIDATION");
      const patch: Record<string, unknown> = {};
      if (payload.url !== undefined) patch.url = str(payload, "url") || null;
      if (payload.editUrl !== undefined) patch.editUrl = str(payload, "editUrl") || null;
      if (payload.thumbnailUrl !== undefined) patch.thumbnailUrl = str(payload, "thumbnailUrl") || null;
      if (payload.title !== undefined) patch.title = sanitizeText(str(payload, "title")).slice(0, 160) || null;
      if (payload.caption !== undefined) patch.caption = sanitizeText(str(payload, "caption")).slice(0, 2200) || null;
      if (payload.notes !== undefined) patch.notes = sanitizeText(str(payload, "notes")).slice(0, 2000) || null;
      if (payload.error !== undefined) patch.error = sanitizeText(str(payload, "error")).slice(0, 500) || null;
      const statusRaw = str(payload, "status").toUpperCase();
      if (["PROCESSING", "READY", "FAILED"].includes(statusRaw)) patch.status = statusRaw;
      await patchStreamClip(id, patch as never);
      return { clipId: id, updated: Object.keys(patch).length };
    }
    case "bridge.status": {
      const { storageBridgeStatus } = await import("@/lib/server/storage-bridge.server");
      return storageBridgeStatus();
    }
    case "bridge.apply_mount": {
      const { applyStorageBridge } = await import("@/lib/server/storage-bridge.server");
      return applyStorageBridge();
    }
    case "bridge.list_drops": {
      const { listMachineDrops } = await import("@/lib/server/storage-bridge.server");
      return { drops: await listMachineDrops() };
    }
    case "bridge.ingest_drop": {
      const dropName = str(payload, "dropName", "name");
      if (!dropName || dropName.includes("..") || dropName.includes("/")) throw new Error("VALIDATION");
      const { ingestMachineDrop } = await import("@/lib/server/storage-bridge.server");
      const result = await ingestMachineDrop({
        actorId,
        dropName,
        clientId: str(payload, "clientId") || null,
        title: str(payload, "title") || undefined,
      });
      return result;
    }
    default:
      return undefined;
  }
}

/**
 * Sync + list a client's Twitch archives (VODs). Resolves or registers the
 * client's stream source, pulls Helix archives, upserts them, returns rows.
 */
export async function streamListVods(input: {
  clientId: string;
  twitchLogin?: string;
  actorId: string;
}): Promise<{ vods: Array<{ id: string; title: string; url: string | null; durationSec: number; viewCount: number | null; publishedAt: string | null }>; sourceId: string }> {
  const clientId = input.clientId;
  const { readStreamSources, upsertTwitchSource } = await import("@/lib/server/stream.server");
  const sources = await readStreamSources(clientId);
  let source = sources.find((row) => row.platform === "TWITCH") ?? null;

  // Resolve login/broadcaster from Twitch Helix when not stored.
  const twitch = await import("@/lib/server/twitch.server");
  if (!(await twitch.twitchConfigured())) throw new Error("TWITCH_UNAVAILABLE");

  let login = input.twitchLogin?.trim() || source?.login || "";
  let broadcasterId = source?.broadcasterId || "";
  let displayName = source?.displayName || login;
  if (!broadcasterId) {
    if (!login) throw new Error("VALIDATION");
    const user = await twitch.helixGetUserByLogin(login);
    if (!user) throw new Error("TWITCH_USER_MISSING");
    broadcasterId = user.id;
    login = user.login;
    displayName = user.displayName;
  }

  if (!source) {
    source = await upsertTwitchSource({
      clientId,
      broadcasterId,
      login,
      displayName,
      createdBy: input.actorId,
    });
  }
  const sourceId = source.id;

  const archives = await twitch.helixListArchives(broadcasterId);
  const { upsertStreamVod } = await import("@/lib/server/stream.server");
  for (const vod of archives) {
    await upsertStreamVod({
      sourceId,
      clientId,
      externalId: vod.id,
      title: vod.title,
      url: vod.url,
      thumbnailUrl: vod.thumbnailUrl,
      durationSec: vod.durationSec,
      viewCount: vod.viewCount,
      publishedAt: vod.publishedAt,
    });
  }
  const vods = await listVodsForClient(clientId);
  return {
    sourceId,
    vods: vods.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      durationSec: row.durationSec,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt,
    })),
  };
}
