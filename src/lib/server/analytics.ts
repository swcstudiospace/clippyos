import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { AnalyticsSnapshot, Client } from "@/lib/entities";
import { parseYouTubeChannelUrl } from "@/lib/youtube";
import { todayIsoDate } from "@/lib/format";

import { isMissingTable, mapClient, mapSnapshot } from "@/lib/server/mappers";
import { SNAPSHOT_JSON_CAP, type TopVideo } from "@/lib/analytics";
import { sanitizeText } from "@/lib/sanitize";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}

export type AnalyticsPayload = {
  clients: Client[];
  snapshots: AnalyticsSnapshot[];
  youtubeDataApi: boolean;
};

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

async function readClients(): Promise<Client[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("clients").select("*").order("name");
    if (!error) return (data ?? []).map((row) => mapClient(row as Record<string, unknown>));
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>("select * from clients order by name");
  return rows.map(mapClient);
}

export async function readSnapshots(): Promise<AnalyticsSnapshot[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("analytics_snapshots")
      .select("*")
      .order("date", { ascending: true });
    if (!error) return (data ?? []).map((row) => mapSnapshot(row as Record<string, unknown>));
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from analytics_snapshots order by date asc",
  );
  return rows.map(mapSnapshot);
}

async function findSnapshot(clientId: string, date: string): Promise<AnalyticsSnapshot | null> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("analytics_snapshots")
      .select("*")
      .eq("client_id", clientId)
      .eq("date", date)
      .maybeSingle();
    if (!error) return data ? mapSnapshot(data as Record<string, unknown>) : null;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from analytics_snapshots where client_id = $1 and date = $2 limit 1",
    [clientId, date],
  );
  return rows[0] ? mapSnapshot(rows[0]) : null;
}

async function upsertSnapshot(row: {
  id: string;
  clientId: string;
  date: string;
  views: number | null;
  subscribers: number | null;
  watchHours: number | null;
  impressionsCtr: number | null;
  topVideos: string | null;
  createdBy: string | null;
  existingId?: string;
}): Promise<AnalyticsSnapshot> {
  const stamp = nowIso();
  const payload = {
    id: row.existingId ?? row.id,
    client_id: row.clientId,
    date: row.date,
    views: row.views,
    subscribers: row.subscribers,
    watch_hours: row.watchHours,
    impressions_ctr: row.impressionsCtr,
    top_videos: row.topVideos ? JSON.parse(row.topVideos) : null,
    created_at: stamp,
    updated_at: stamp,
    created_by: row.createdBy,
  };
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    if (row.existingId) {
      const { data, error } = await admin
        .from("analytics_snapshots")
        .update({
          views: payload.views,
          subscribers: payload.subscribers,
          watch_hours: payload.watch_hours,
          impressions_ctr: payload.impressions_ctr,
          top_videos: payload.top_videos,
          updated_at: stamp,
        })
        .eq("id", row.existingId)
        .select("*")
        .maybeSingle();
      if (!error && data) return mapSnapshot(data as Record<string, unknown>);
      if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    } else {
      const { data, error } = await admin
        .from("analytics_snapshots")
        .insert(payload)
        .select("*")
        .maybeSingle();
      if (!error && data) return mapSnapshot(data as Record<string, unknown>);
      if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    }
  }
  const sql = await (await load_agency_db()).localSql();
  if (row.existingId) {
    const rows = await sql.query<Record<string, unknown>>(
      `update analytics_snapshots
       set views = $2, subscribers = $3, watch_hours = $4, impressions_ctr = $5,
           top_videos = $6::jsonb, updated_at = $7
       where id = $1
       returning *`,
      [
        row.existingId,
        row.views,
        row.subscribers,
        row.watchHours,
        row.impressionsCtr,
        row.topVideos,
        stamp,
      ],
    );
    if (rows[0]) return mapSnapshot(rows[0]);
  } else {
    const rows = await sql.query<Record<string, unknown>>(
      `insert into analytics_snapshots
         (id, client_id, date, views, subscribers, watch_hours, impressions_ctr, top_videos, created_at, updated_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$9,$10)
       returning *`,
      [
        row.id,
        row.clientId,
        row.date,
        row.views,
        row.subscribers,
        row.watchHours,
        row.impressionsCtr,
        row.topVideos,
        stamp,
        row.createdBy,
      ],
    );
    if (rows[0]) return mapSnapshot(rows[0]);
  }
  throw new Error("DATA_UNAVAILABLE");
}

async function patchClientChannel(params: {
  id: string;
  channelUrl: string;
  channelThumbnail: string | null;
  name?: string;
}): Promise<void> {
  const stamp = nowIso();
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const patch: Record<string, unknown> = {
      channel_url: params.channelUrl,
      channel_thumbnail: params.channelThumbnail,
      updated_at: stamp,
    };
    if (params.name) patch.name = params.name;
    const { error } = await admin.from("clients").update(patch).eq("id", params.id);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  if (params.name) {
    await sql.query(
      "update clients set channel_url = $2, channel_thumbnail = $3, name = $4, updated_at = $5 where id = $1",
      [params.id, params.channelUrl, params.channelThumbnail, params.name, stamp],
    );
  } else {
    await sql.query(
      "update clients set channel_url = $2, channel_thumbnail = $3, updated_at = $4 where id = $1",
      [params.id, params.channelUrl, params.channelThumbnail, stamp],
    );
  }
}

async function ensureSnapshotUnique(): Promise<void> {
  try {
    const sql = await (await load_agency_db()).localSql();
    await sql.query(
      "create unique index if not exists analytics_snapshots_client_date_uidx on analytics_snapshots (client_id, date)",
    );
  } catch {
    /* already present or local store unavailable */
  }
}

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<AnalyticsPayload> => {
    await ensureSnapshotUnique();
    const { youtubeDataApiAvailable } = await import("@/lib/server/youtube-data.server");
    const [clients, snapshots, youtubeDataApi] = await Promise.all([
      readClients(),
      readSnapshots(),
      youtubeDataApiAvailable(),
    ]);
    return { clients, snapshots, youtubeDataApi };
  });

const ConnectSchema = z.object({
  input: z.string().trim().min(1).max(500),
  clientId: z.string().min(1).nullable(),
});

export type ConnectResult =
  | {
      ok: true;
      client: Client;
      channelUrl: string;
      channelTitle: string;
      alreadyLinked: boolean;
    }
  | { ok: false; reason: "NO_CLIENT"; channelTitle: string; channelUrl: string };

function matchClient(clients: Client[], channelId: string | null, canonical: string): Client | null {
  const active = clients.filter((row) => row.status === "ACTIVE" && !row.deletedAt);
  if (channelId) {
    const hit = active.find((row) => (row.channelUrl ?? "").includes(channelId));
    if (hit) return hit;
  }
  const hit = active.find((row) => row.channelUrl === canonical);
  return hit ?? null;
}

export const connectChannel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => ConnectSchema.parse(input))
  .handler(async ({ data }): Promise<ConnectResult> => {
    const parsed = parseYouTubeChannelUrl(data.input);
    if (!parsed.ok) throw new Error("INVALID_YOUTUBE_URL");
    const { fetchChannelSnapshot } = await import("@/lib/server/youtube.server");
    let snapshot;
    try {
      snapshot = await fetchChannelSnapshot(parsed.canonical);
    } catch {
      throw new Error("YOUTUBE_UNAVAILABLE");
    }
    const canonical = snapshot.canonicalUrl || parsed.canonical;
    const clients = await readClients();
    let client: Client | null = data.clientId
      ? (clients.find((row) => row.id === data.clientId) ?? null)
      : matchClient(clients, snapshot.channelId, canonical);
    if (!client) {
      return {
        ok: false,
        reason: "NO_CLIENT",
        channelTitle: snapshot.title,
        channelUrl: canonical,
      };
    }
    const alreadyLinked = Boolean(
      client.channelUrl &&
        (client.channelUrl === canonical ||
          (snapshot.channelId && client.channelUrl.includes(snapshot.channelId))),
    );
    if (!alreadyLinked) {
      await patchClientChannel({
        id: client.id,
        channelUrl: canonical,
        channelThumbnail: snapshot.thumbnail,
      });
    }
    const refreshed = (await readClients()).find((row) => row.id === client!.id) ?? client;
    return {
      ok: true,
      client: refreshed,
      channelUrl: canonical,
      channelTitle: snapshot.title,
      alreadyLinked,
    };
  });

function channelLookup(url: string): { channelId?: string; handle?: string } {
  const parsed = parseYouTubeChannelUrl(url);
  if (!parsed.ok) return {};
  if (parsed.kind === "channel") return { channelId: parsed.value };
  if (parsed.kind === "handle") return { handle: parsed.value };
  return {};
}

export async function persistPull(params: {
  client: Client;
  userId: string;
}): Promise<AnalyticsSnapshot> {
  const url = params.client.channelUrl;
  if (!url) throw new Error("CHANNEL_MISSING");
  const { pullPublicAnalytics } = await import("@/lib/server/youtube-data.server");
  const lookup = channelLookup(url);
  if (!lookup.channelId && !lookup.handle) {
    const { fetchChannelSnapshot } = await import("@/lib/server/youtube.server");
    const snap = await fetchChannelSnapshot(url);
    if (snap.channelId) lookup.channelId = snap.channelId;
  }
  if (!lookup.channelId && !lookup.handle) throw new Error("YOUTUBE_CHANNEL_NOT_FOUND");
  const pulled = await pullPublicAnalytics(lookup);
  const date = todayIsoDate();
  const existing = await findSnapshot(params.client.id, date);
  const topVideos = JSON.stringify(pulled.topVideos).slice(0, SNAPSHOT_JSON_CAP);
  const saved = await upsertSnapshot({
    id: newId(),
    existingId: existing?.id,
    clientId: params.client.id,
    date,
    views: pulled.views,
    subscribers: pulled.subscribers,
    watchHours: null,
    impressionsCtr: null,
    topVideos,
    createdBy: params.userId,
  });
  if (pulled.channel.canonicalUrl && pulled.channel.canonicalUrl !== params.client.channelUrl) {
    await patchClientChannel({
      id: params.client.id,
      channelUrl: pulled.channel.canonicalUrl,
      channelThumbnail: pulled.channel.thumbnail,
    });
  }
  return saved;
}

const PullSchema = z.object({
  clientId: z.string().min(1).nullable(),
});

export const pullAnalytics = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => PullSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { youtubeDataApiAvailable } = await import("@/lib/server/youtube-data.server");
    if (!(await youtubeDataApiAvailable())) throw new Error("YOUTUBE_KEY_MISSING");
    const clients = await readClients();
    const targets = data.clientId
      ? clients.filter((row) => row.id === data.clientId)
      : clients.filter(
          (row) => row.status === "ACTIVE" && !row.deletedAt && row.channelUrl,
        );
    if (targets.length === 0) throw new Error("CLIENT_MISSING");
    const results: { clientId: string; ok: boolean }[] = [];
    for (const client of targets.slice(0, 8)) {
      try {
        await persistPull({ client, userId: context.userId });
        results.push({ clientId: client.id, ok: true });
      } catch (error) {
        if (error instanceof Error && error.message === "YOUTUBE_QUOTA") throw error;
        results.push({ clientId: client.id, ok: false });
      }
    }
    if (data.clientId && results[0] && !results[0].ok) throw new Error("YOUTUBE_UNAVAILABLE");
    return { results };
  });

const ManualVideoSchema = z.object({
  title: z.string().trim().min(1).max(300),
  views: z.number().min(0).max(1e15).nullable(),
  url: z.string().trim().max(500).nullable(),
});

const ManualSchema = z.object({
  clientId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  views: z.number().min(0).max(1e15).nullable(),
  subscribers: z.number().min(0).max(1e12).nullable(),
  watchHours: z.number().min(0).max(1e9).nullable(),
  impressionsCtr: z.number().min(0).max(100).nullable(),
  topVideos: z.array(ManualVideoSchema).max(20).optional(),
  overwrite: z.boolean(),
});

export const saveManualSnapshot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => ManualSchema.parse(input))
  .handler(async ({ data, context }) => {
    const clients = await readClients();
    const client = clients.find((row) => row.id === data.clientId);
    if (!client) throw new Error("CLIENT_MISSING");
    const existing = await findSnapshot(data.clientId, data.date);
    if (existing && !data.overwrite) throw new Error("SNAPSHOT_EXISTS");
    const videos: TopVideo[] = (data.topVideos ?? []).map((row) => ({
      videoId: "",
      title: sanitizeText(row.title),
      views: row.views,
      likes: null,
      durationSeconds: null,
      publishedAt: null,
      thumbnail: null,
      url: row.url && row.url.startsWith("https://") ? row.url : "",
      isLongForm: true,
    }));
    return upsertSnapshot({
      id: newId(),
      existingId: existing?.id,
      clientId: data.clientId,
      date: data.date,
      views: data.views,
      subscribers: data.subscribers,
      watchHours: data.watchHours,
      impressionsCtr: data.impressionsCtr,
      topVideos: videos.length ? JSON.stringify(videos) : null,
      createdBy: context.userId,
    });
  });
