import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type {
  ThumbnailMessage,
  ThumbnailMessageMeta,
  ThumbnailSession,
} from "@/lib/entities";
import {
  cleanThumbnailMessage,
  isTrustedImageUrl,
  MAX_OVERLAY_DATA_CHARS,
  titleFromThumbnailPrompt,
  VARIATION_HINTS,
} from "@/lib/thumbnails";

import {
  isMissingTable,
  mapThumbnailMessage,
  mapThumbnailSession,
} from "@/lib/server/mappers";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}

export type SessionListItem = ThumbnailSession & {
  clientName: string | null;
  imageCount: number;
  avgRating: number | null;
};

export type ThumbnailSendResult = {
  ok: boolean;
  session: SessionListItem;
  messages: ThumbnailMessage[];
  pendingImageId: string | null;
  fallback: boolean;
  imageFallback: boolean;
};

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

async function clientNameMap(): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("clients").select("id,name,deleted_at");
    if (!error) {
      for (const row of data ?? []) {
        const record = row as { id?: string; name?: string; deleted_at?: string | null };
        if (record.id && !record.deleted_at) names.set(record.id, String(record.name ?? ""));
      }
      return names;
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<{ id: string; name: string }>(
    "select id, name from clients where deleted_at is null",
  );
  for (const row of rows) names.set(row.id, row.name);
  return names;
}

async function assertActiveClient(clientId: string): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("clients")
      .select("id,status,deleted_at")
      .eq("id", clientId)
      .maybeSingle();
    if (!error) {
      const record = data as { id?: string; status?: string; deleted_at?: string | null } | null;
      if (!record?.id || record.deleted_at || record.status === "CHURNED") {
        throw new Error("CLIENT_MISSING");
      }
      return;
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<{ id: string; status: string; deleted_at: string | null }>(
    "select id, status, deleted_at from clients where id = $1",
    [clientId],
  );
  const row = rows[0];
  if (!row || row.deleted_at || row.status === "CHURNED") throw new Error("CLIENT_MISSING");
}

async function readSessions(): Promise<ThumbnailSession[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("thumbnail_sessions")
      .select("*")
      .eq("status", "ACTIVE")
      .order("updated_at", { ascending: false });
    if (!error) {
      return (data ?? []).map((row) => mapThumbnailSession(row as Record<string, unknown>));
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from thumbnail_sessions where status = 'ACTIVE' order by updated_at desc",
  );
  return rows.map(mapThumbnailSession);
}

async function readSession(id: string): Promise<ThumbnailSession | null> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("thumbnail_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error) {
      return data ? mapThumbnailSession(data as Record<string, unknown>) : null;
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from thumbnail_sessions where id = $1",
    [id],
  );
  return rows[0] ? mapThumbnailSession(rows[0]) : null;
}

async function readMessages(sessionId: string): Promise<ThumbnailMessage[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("thumbnail_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });
    if (!error) {
      return (data ?? []).map((row) => mapThumbnailMessage(row as Record<string, unknown>));
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from thumbnail_messages where session_id = $1 order by timestamp asc",
    [sessionId],
  );
  return rows.map(mapThumbnailMessage);
}

async function messageStats(
  sessionIds: string[],
): Promise<Map<string, { imageCount: number; avgRating: number | null }>> {
  const stats = new Map<string, { imageCount: number; ratings: number[] }>();
  for (const id of sessionIds) stats.set(id, { imageCount: 0, ratings: [] });
  if (sessionIds.length === 0) {
    return new Map(
      [...stats.entries()].map(([id, value]) => [
        id,
        { imageCount: value.imageCount, avgRating: null },
      ]),
    );
  }
  const admin = await (await load_agency_db()).getAgencyAdmin();
  let rows: { session_id: string; image_url: string | null; rating: number | null }[] = [];
  let remoteOk = false;
  if (admin) {
    const { data, error } = await admin
      .from("thumbnail_messages")
      .select("session_id,image_url,rating");
    if (!error) {
      rows = (data ?? []) as typeof rows;
      remoteOk = true;
    } else if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  if (!remoteOk) {
    try {
      const sql = await (await load_agency_db()).localSql();
      rows = await sql.query<{
        session_id: string;
        image_url: string | null;
        rating: number | null;
      }>("select session_id, image_url, rating from thumbnail_messages");
    } catch {
      /* empty */
    }
  }
  for (const row of rows) {
    const current = stats.get(row.session_id);
    if (!current) continue;
    if (row.image_url) current.imageCount += 1;
    if (row.rating != null) current.ratings.push(Number(row.rating));
  }
  const result = new Map<string, { imageCount: number; avgRating: number | null }>();
  for (const [id, value] of stats) {
    const avg =
      value.ratings.length === 0
        ? null
        : value.ratings.reduce((sum, n) => sum + n, 0) / value.ratings.length;
    result.set(id, { imageCount: value.imageCount, avgRating: avg });
  }
  return result;
}

async function decorate(session: ThumbnailSession): Promise<SessionListItem> {
  const [names, stats] = await Promise.all([
    clientNameMap(),
    messageStats([session.id]),
  ]);
  const row = stats.get(session.id) ?? { imageCount: 0, avgRating: null };
  return {
    ...session,
    clientName: names.get(session.clientId) ?? null,
    imageCount: row.imageCount,
    avgRating: row.avgRating,
  };
}

async function insertSession(row: {
  id: string;
  client_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("thumbnail_sessions").insert(row);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into thumbnail_sessions (id, client_id, title, status, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$5,$6)`,
    [row.id, row.client_id, row.title, row.status, row.created_at, row.created_by],
  );
}

async function insertMessage(row: {
  id: string;
  session_id: string;
  role: string;
  content: string;
  image_url: string | null;
  rating: number | null;
  timestamp: string;
  metadata: ThumbnailMessageMeta | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  const metadata = row.metadata == null ? null : JSON.stringify(row.metadata);
  if (admin) {
    const { error } = await admin.from("thumbnail_messages").insert({
      ...row,
      metadata: row.metadata ?? null,
    });
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into thumbnail_messages
      (id, session_id, role, content, image_url, rating, timestamp, metadata, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10)`,
    [
      row.id,
      row.session_id,
      row.role,
      row.content,
      row.image_url,
      row.rating,
      row.timestamp,
      metadata,
      row.created_at,
      row.created_by,
    ],
  );
}

async function patchSession(id: string, patch: Record<string, unknown>): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("thumbnail_sessions").update(patch).eq("id", id);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(patch)) {
    sets.push(`${key} = $${i}`);
    values.push(value);
    i += 1;
  }
  values.push(id);
  await sql.query(`update thumbnail_sessions set ${sets.join(", ")} where id = $${i}`, values);
}

async function patchMessage(id: string, patch: Record<string, unknown>): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  const payload = { ...patch };
  if ("metadata" in payload && payload.metadata && typeof payload.metadata === "object") {
    /* supabase accepts object */
  }
  if (admin) {
    const { error } = await admin.from("thumbnail_messages").update(payload).eq("id", id);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(patch)) {
    sets.push(`${key} = $${i}`);
    values.push(key === "metadata" && value && typeof value === "object" ? JSON.stringify(value) : value);
    i += 1;
  }
  values.push(id);
  await sql.query(`update thumbnail_messages set ${sets.join(", ")} where id = $${i}`, values);
}

export const listThumbnailSessions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<SessionListItem[]> => {
    const [sessions, names] = await Promise.all([readSessions(), clientNameMap()]);
    const stats = await messageStats(sessions.map((row) => row.id));
    return sessions.map((session) => {
      const row = stats.get(session.id) ?? { imageCount: 0, avgRating: null };
      return {
        ...session,
        clientName: names.get(session.clientId) ?? null,
        imageCount: row.imageCount,
        avgRating: row.avgRating,
      };
    });
  });

export const listThumbnailMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }): Promise<ThumbnailMessage[]> => {
    const session = await readSession(id);
    if (!session) throw new Error("SESSION_MISSING");
    return readMessages(id);
  });

export const renameThumbnailSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string().min(1), title: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<SessionListItem> => {
    const session = await readSession(data.id);
    if (!session) throw new Error("SESSION_MISSING");
    const stamp = nowIso();
    await patchSession(data.id, { title: data.title, updated_at: stamp });
    return decorate({ ...session, title: data.title, updatedAt: stamp });
  });

export const archiveThumbnailSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }): Promise<{ id: string }> => {
    const session = await readSession(id);
    if (!session) throw new Error("SESSION_MISSING");
    await patchSession(id, { status: "ARCHIVED", updated_at: nowIso() });
    return { id };
  });

export const deleteThumbnailSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }): Promise<{ id: string }> => {
    const session = await readSession(id);
    if (!session) throw new Error("SESSION_MISSING");
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (admin) {
      const messages = await admin.from("thumbnail_messages").delete().eq("session_id", id);
      const sessions = await admin.from("thumbnail_sessions").delete().eq("id", id);
      if (!messages.error && !sessions.error) return { id };
      if (
        !isMissingTable(messages.error) &&
        !isMissingTable(sessions.error) &&
        (messages.error || sessions.error)
      ) {
        throw new Error("DATA_UNAVAILABLE");
      }
    }
    const sql = await (await load_agency_db()).localSql();
    await sql.query("delete from thumbnail_messages where session_id = $1", [id]);
    await sql.query("delete from thumbnail_sessions where id = $1", [id]);
    return { id };
  });

async function writeAssistant(params: {
  sessionId: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  metadata: ThumbnailMessageMeta | null;
}): Promise<ThumbnailMessage> {
  const stamp = nowIso();
  const message: ThumbnailMessage = {
    id: newId(),
    sessionId: params.sessionId,
    role: "assistant",
    content: params.content,
    imageUrl: params.imageUrl,
    rating: null,
    timestamp: stamp,
    metadata: params.metadata,
    createdAt: stamp,
    updatedAt: stamp,
    createdBy: params.userId,
  };
  await insertMessage({
    id: message.id,
    session_id: message.sessionId,
    role: "assistant",
    content: message.content,
    image_url: message.imageUrl,
    rating: null,
    timestamp: stamp,
    metadata: message.metadata,
    created_at: stamp,
    updated_at: stamp,
    created_by: params.userId,
  });
  await patchSession(params.sessionId, { updated_at: stamp });
  return message;
}

export const sendThumbnailMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        sessionId: z.string().min(1).optional(),
        clientId: z.string().min(1),
        content: z.string().max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<ThumbnailSendResult> => {
    const content = cleanThumbnailMessage(data.content);
    if (!content) throw new Error("EMPTY_MESSAGE");
    await assertActiveClient(data.clientId);
    const stamp = nowIso();
    let session = data.sessionId ? await readSession(data.sessionId) : null;
    if (data.sessionId && !session) throw new Error("SESSION_MISSING");
    if (session && session.clientId !== data.clientId) throw new Error("CLIENT_REQUIRED");
    if (!session) {
      session = {
        id: newId(),
        clientId: data.clientId,
        title: titleFromThumbnailPrompt(content),
        status: "ACTIVE",
        createdAt: stamp,
        updatedAt: stamp,
        createdBy: context.userId,
      };
      await insertSession({
        id: session.id,
        client_id: session.clientId,
        title: session.title,
        status: "ACTIVE",
        created_at: stamp,
        updated_at: stamp,
        created_by: context.userId,
      });
    }
    await insertMessage({
      id: newId(),
      session_id: session.id,
      role: "user",
      content,
      image_url: null,
      rating: null,
      timestamp: stamp,
      metadata: null,
      created_at: stamp,
      updated_at: stamp,
      created_by: context.userId,
    });
    const history = await readMessages(session.id);
    const decorated = await decorate({ ...session, updatedAt: stamp });
    const { llmAvailable } = await import("@/lib/server/analyze.server");
    const { imageGenAvailable } = await import("@/lib/server/higgsfield.server");
    const imageReady = await imageGenAvailable();
    if (!(await llmAvailable())) {
      return {
        ok: false,
        session: decorated,
        messages: history,
        pendingImageId: null,
        fallback: true,
        imageFallback: !imageReady,
      };
    }
    try {
      const agent = await import("@/lib/server/thumbnails-agent.server");
      const ideationAgent = await import("@/lib/server/ideation-agent.server");
      const isFirstTurn = history.filter((row) => row.role === "user").length === 1;
      const [knowledge, clientSummary] = await Promise.all([
        agent.loadThumbnailKnowledge(),
        ideationAgent.loadClientSummary(session.clientId),
      ]);
      const titlePromise = isFirstTurn
        ? agent.suggestSessionTitle(content)
        : Promise.resolve(null);
      const direction = await agent.runThumbnailDirection(history, clientSummary, knowledge);
      const assistant = await writeAssistant({
        sessionId: session.id,
        userId: context.userId,
        content: direction.direction,
        imageUrl: null,
        metadata: { kind: "turn", imagePrompt: direction.imagePrompt },
      });
      const generatedTitle = await titlePromise;
      if (generatedTitle && generatedTitle !== session.title) {
        await patchSession(session.id, { title: generatedTitle, updated_at: nowIso() });
        session.title = generatedTitle;
      }
      const latest = await readSession(session.id);
      return {
        ok: true,
        session: await decorate(latest ?? session),
        messages: [...history, assistant],
        pendingImageId: assistant.id,
        fallback: false,
        imageFallback: !imageReady,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "AI_UNAVAILABLE") {
        return {
          ok: false,
          session: decorated,
          messages: history,
          pendingImageId: null,
          fallback: true,
          imageFallback: !imageReady,
        };
      }
      if (error instanceof Error && error.message === "AI_RATE_LIMIT") {
        throw error;
      }
      return {
        ok: false,
        session: decorated,
        messages: history,
        pendingImageId: null,
        fallback: false,
        imageFallback: !imageReady,
      };
    }
  });

export const generateThumbnailImageFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        messageId: z.string().min(1),
        variationHint: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ThumbnailSendResult> => {
    const admin = await (await load_agency_db()).getAgencyAdmin();
    let message: ThumbnailMessage | null = null;
    if (admin) {
      const { data: row, error } = await admin
        .from("thumbnail_messages")
        .select("*")
        .eq("id", data.messageId)
        .maybeSingle();
      if (!error && row) message = mapThumbnailMessage(row as Record<string, unknown>);
      if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    }
    if (!message) {
      const sql = await (await load_agency_db()).localSql();
      const rows = await sql.query<Record<string, unknown>>(
        "select * from thumbnail_messages where id = $1",
        [data.messageId],
      );
      message = rows[0] ? mapThumbnailMessage(rows[0]) : null;
    }
    if (!message) throw new Error("SESSION_MISSING");
    const session = await readSession(message.sessionId);
    if (!session) throw new Error("SESSION_MISSING");
    const { generateThumbnailImage, imageGenAvailable } = await import(
      "@/lib/server/higgsfield.server"
    );
    const imageReady = await imageGenAvailable();
    if (!imageReady) {
      const meta: ThumbnailMessageMeta = { ...(message.metadata ?? {}), imageFailed: true };
      await patchMessage(message.id, { metadata: meta, updated_at: nowIso() });
      return {
        ok: false,
        session: await decorate(session),
        messages: await readMessages(session.id),
        pendingImageId: message.id,
        fallback: false,
        imageFallback: true,
      };
    }
    const basePrompt =
      message.metadata?.imagePrompt ||
      message.content ||
      "16:9 YouTube thumbnail, 4K, bold readable text at small sizes, high contrast";
    const prompt = data.variationHint ? `${basePrompt}\n${data.variationHint}` : basePrompt;
    const result = await generateThumbnailImage(prompt);
    const stamp = nowIso();
    if (result.ok && isTrustedImageUrl(result.url)) {
      const meta: ThumbnailMessageMeta = {
        ...(message.metadata ?? {}),
        imageFailed: undefined,
        imagePrompt: basePrompt,
      };
      await patchMessage(message.id, {
        image_url: result.url,
        metadata: meta,
        updated_at: stamp,
      });
    } else {
      const meta: ThumbnailMessageMeta = { ...(message.metadata ?? {}), imageFailed: true };
      await patchMessage(message.id, { metadata: meta, updated_at: stamp });
    }
    await patchSession(session.id, { updated_at: stamp });
    return {
      ok: result.ok,
      session: await decorate(session),
      messages: await readMessages(session.id),
      pendingImageId: result.ok ? null : message.id,
      fallback: false,
      imageFallback: !result.ok && result.error === "missing",
    };
  });

export const regenerateThumbnail = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ messageId: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }): Promise<ThumbnailSendResult> => {
    const messages = await (async () => {
      const sqlProbe = await (await load_agency_db()).localSql();
      const admin = await (await load_agency_db()).getAgencyAdmin();
      if (admin) {
        const { data: row, error } = await admin
          .from("thumbnail_messages")
          .select("*")
          .eq("id", data.messageId)
          .maybeSingle();
        if (!error && row) return mapThumbnailMessage(row as Record<string, unknown>);
      }
      const rows = await sqlProbe.query<Record<string, unknown>>(
        "select * from thumbnail_messages where id = $1",
        [data.messageId],
      );
      return rows[0] ? mapThumbnailMessage(rows[0]) : null;
    })();
    if (!messages) throw new Error("SESSION_MISSING");
    const session = await readSession(messages.sessionId);
    if (!session) throw new Error("SESSION_MISSING");
    const prompt = messages.metadata?.imagePrompt || messages.content;
    const created = await writeAssistant({
      sessionId: session.id,
      userId: context.userId,
      content: "Another take on the same direction.",
      imageUrl: null,
      metadata: {
        kind: "regenerate",
        parentId: messages.id,
        imagePrompt: prompt,
      },
    });
    return {
      ok: true,
      session: await decorate(session),
      messages: await readMessages(session.id),
      pendingImageId: created.id,
      fallback: false,
      imageFallback: false,
    };
  });

export const startThumbnailVariations = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ messageId: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }): Promise<ThumbnailSendResult & { variationIds: string[] }> => {
    const admin = await (await load_agency_db()).getAgencyAdmin();
    let source: ThumbnailMessage | null = null;
    if (admin) {
      const { data: row, error } = await admin
        .from("thumbnail_messages")
        .select("*")
        .eq("id", data.messageId)
        .maybeSingle();
      if (!error && row) source = mapThumbnailMessage(row as Record<string, unknown>);
    }
    if (!source) {
      const sql = await (await load_agency_db()).localSql();
      const rows = await sql.query<Record<string, unknown>>(
        "select * from thumbnail_messages where id = $1",
        [data.messageId],
      );
      source = rows[0] ? mapThumbnailMessage(rows[0]) : null;
    }
    if (!source) throw new Error("SESSION_MISSING");
    const session = await readSession(source.sessionId);
    if (!session) throw new Error("SESSION_MISSING");
    const prompt = source.metadata?.imagePrompt || source.content;
    const created: ThumbnailMessage[] = [];
    for (const hint of VARIATION_HINTS) {
      const row = await writeAssistant({
        sessionId: session.id,
        userId: context.userId,
        content: "Variation",
        imageUrl: null,
        metadata: {
          kind: "variation",
          parentId: source.id,
          imagePrompt: `${prompt}\n${hint}`,
        },
      });
      created.push(row);
    }
    return {
      ok: true,
      session: await decorate(session),
      messages: await readMessages(session.id),
      pendingImageId: created[0]?.id ?? null,
      fallback: false,
      imageFallback: false,
      variationIds: created.map((row) => row.id),
    };
  });

export const rateThumbnailMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ messageId: z.string().min(1), rating: z.number().int().min(1).max(5) }).parse(input),
  )
  .handler(async ({ data }): Promise<ThumbnailMessage> => {
    const admin = await (await load_agency_db()).getAgencyAdmin();
    let message: ThumbnailMessage | null = null;
    if (admin) {
      const { data: row, error } = await admin
        .from("thumbnail_messages")
        .select("*")
        .eq("id", data.messageId)
        .maybeSingle();
      if (!error && row) message = mapThumbnailMessage(row as Record<string, unknown>);
    }
    if (!message) {
      const sql = await (await load_agency_db()).localSql();
      const rows = await sql.query<Record<string, unknown>>(
        "select * from thumbnail_messages where id = $1",
        [data.messageId],
      );
      message = rows[0] ? mapThumbnailMessage(rows[0]) : null;
    }
    if (!message) throw new Error("SESSION_MISSING");
    const stamp = nowIso();
    await patchMessage(message.id, { rating: data.rating, updated_at: stamp });
    await patchSession(message.sessionId, { updated_at: stamp });
    return { ...message, rating: data.rating, updatedAt: stamp };
  });

const OverlaySchema = z.object({
  sessionId: z.string().min(1),
  parentId: z.string().min(1),
  overlayText: z.string().trim().min(1).max(80),
  imageDataUrl: z.string().min(20).max(MAX_OVERLAY_DATA_CHARS),
});

export const saveThumbnailOverlay = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => OverlaySchema.parse(input))
  .handler(async ({ data, context }): Promise<ThumbnailSendResult> => {
    if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(data.imageDataUrl)) {
      throw new Error("UNTRUSTED_IMAGE");
    }
    if (data.imageDataUrl.length > MAX_OVERLAY_DATA_CHARS) {
      throw new Error("OVERLAY_TOO_LARGE");
    }
    const session = await readSession(data.sessionId);
    if (!session) throw new Error("SESSION_MISSING");
    const created = await writeAssistant({
      sessionId: session.id,
      userId: context.userId,
      content: `Overlay: ${data.overlayText}`,
      imageUrl: data.imageDataUrl,
      metadata: {
        kind: "overlay",
        parentId: data.parentId,
        overlayText: data.overlayText,
      },
    });
    void created;
    return {
      ok: true,
      session: await decorate(session),
      messages: await readMessages(session.id),
      pendingImageId: null,
      fallback: false,
      imageFallback: false,
    };
  });

export const fetchTrustedImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ url: z.string().min(1).max(4000) }).parse(input))
  .handler(async ({ data }): Promise<{ dataUrl: string; filename: string }> => {
    if (!isTrustedImageUrl(data.url)) throw new Error("UNTRUSTED_IMAGE");
    if (data.url.startsWith("data:image/")) {
      return { dataUrl: data.url, filename: "thumbnail.png" };
    }
    const response = await fetch(data.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error("IMAGE_FAILED");
    const mime = (response.headers.get("content-type") ?? "image/png").split(";")[0]!;
    if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(mime)) throw new Error("UNTRUSTED_IMAGE");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > 8_000_000) throw new Error("OVERLAY_TOO_LARGE");
    const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : mime.split("/")[1] ?? "png";
    return {
      dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
      filename: `thumbnail.${ext}`,
    };
  });
