import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type {
  KnowledgeEntry,
  SuggestedIdeasPayload,
  SuggestedTitlesPayload,
} from "@/lib/entities";
import {
  CLIENT_TRAINING_SCOPES,
  type ClientTrainingScope,
} from "@/lib/client-tools";
import {
  KNOWLEDGE_LIST_MAX,
  MAX_TRAINING_CHARS,
  cleanTrainingInput,
} from "@/lib/knowledge";

import { isMissingColumn, isMissingTable, mapClient, mapKnowledgeEntry } from "@/lib/server/mappers";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}

export type ClientTrainingEntry = Pick<
  KnowledgeEntry,
  "id" | "scope" | "clientId" | "userInput" | "learnedPrinciple" | "timestamp" | "createdAt"
>;

const scopeSchema = z.enum(CLIENT_TRAINING_SCOPES);

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function toTrainingEntry(row: KnowledgeEntry): ClientTrainingEntry {
  return {
    id: row.id,
    scope: row.scope,
    clientId: row.clientId,
    userInput: row.userInput,
    learnedPrinciple: row.learnedPrinciple,
    timestamp: row.timestamp,
    createdAt: row.createdAt,
  };
}

async function readClient(id: string) {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("clients").select("*").eq("id", id).maybeSingle();
    if (!error) {
      if (!data) throw new Error("CLIENT_MISSING");
      const client = mapClient(data as Record<string, unknown>);
      if (client.deletedAt) throw new Error("CLIENT_MISSING");
      return client;
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>("select * from clients where id = $1", [id]);
  if (!rows[0]) throw new Error("CLIENT_MISSING");
  const client = mapClient(rows[0]);
  if (client.deletedAt) throw new Error("CLIENT_MISSING");
  return client;
}

async function ensureLocalSuggestionColumns(): Promise<void> {
  const sql = await (await load_agency_db()).localSql();
  await sql.query("alter table clients add column if not exists suggested_titles text");
  await sql.query("alter table clients add column if not exists suggested_ideas text");
  await sql.query("alter table clients add column if not exists suggested_titles_at timestamptz");
  await sql.query("alter table clients add column if not exists suggested_ideas_at timestamptz");
}

async function patchSuggestions(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("clients").update(patch).eq("id", id);
    if (!error) return;
    if (!isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    await ensureLocalSuggestionColumns();
    const sql = await (await load_agency_db()).localSql();
    const keys = Object.keys(patch);
    const assignments = keys.map((key, index) => `${key} = $${index + 2}`).join(", ");
    await sql.query(`update clients set ${assignments} where id = $1`, [
      id,
      ...keys.map((key) => patch[key]),
    ]);
  } catch {
    throw new Error("DATA_UNAVAILABLE");
  }
}

async function readClientEntries(
  scope: ClientTrainingScope,
  clientId: string,
): Promise<KnowledgeEntry[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("knowledge_entries")
      .select("*")
      .eq("scope", scope)
      .eq("client_id", clientId)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .order("timestamp", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(KNOWLEDGE_LIST_MAX);
    if (!error) {
      return (data ?? []).map((row) => mapKnowledgeEntry(row as Record<string, unknown>));
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    `select * from knowledge_entries
     where scope = $1 and client_id = $2 and status = 'ACTIVE' and deleted_at is null
     order by timestamp asc nulls last, created_at asc
     limit $3`,
    [scope, clientId, KNOWLEDGE_LIST_MAX],
  );
  return rows.map(mapKnowledgeEntry);
}

async function insertEntry(row: {
  id: string;
  scope: string;
  client_id: string;
  user_input: string;
  learned_principle: string;
  status: string;
  tags: null;
  timestamp: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  deleted_at: string | null;
}): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("knowledge_entries").insert(row);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into knowledge_entries
      (id, scope, client_id, user_input, learned_principle, status, tags, timestamp,
       created_at, updated_at, created_by, deleted_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11)`,
    [
      row.id,
      row.scope,
      row.client_id,
      row.user_input,
      row.learned_principle,
      row.status,
      row.tags,
      row.timestamp,
      row.created_at,
      row.created_by,
      row.deleted_at,
    ],
  );
}

export async function internalGenerateSuggestedTitles(
  clientId: string,
): Promise<SuggestedTitlesPayload> {
  const { llmAvailable } = await import("@/lib/server/analyze.server");
  if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");
  const client = await readClient(clientId);
  if (!client.channelUrl) throw new Error("CHANNEL_MISSING");
  const { pickLastLongForm } = await import("@/lib/server/youtube.server");
  let videos;
  try {
    videos = await pickLastLongForm(client.channelUrl, 5);
  } catch {
    throw new Error("YOUTUBE_UNAVAILABLE");
  }
  const { loadKnowledgeDigest } = await import("@/lib/server/knowledge.server");
  const [videoGlobal, clientTitles, clientClipping] = await Promise.all([
    loadKnowledgeDigest("VIDEO_GLOBAL"),
    loadKnowledgeDigest("CLIENT_TITLES", client.id),
    loadKnowledgeDigest("CLIENT_CLIPPING", client.id),
  ]);
  const { generateTitleSuggestions } = await import("@/lib/server/client-tools-agent.server");
  let payload: SuggestedTitlesPayload;
  try {
    payload = await generateTitleSuggestions({
      client,
      videos,
      videoGlobal: [videoGlobal, clientClipping].filter(Boolean).join("\n\n") || videoGlobal,
      clientTitles,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")
    ) {
      throw error;
    }
    throw new Error("GENERATION_FAILED");
  }
  const stamp = payload.generatedAt;
  await patchSuggestions(client.id, {
    suggested_titles: JSON.stringify(payload),
    suggested_titles_at: stamp,
    updated_at: stamp,
  });
  return payload;
}

export const generateSuggestedTitles = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ clientId: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<SuggestedTitlesPayload> => {
    return internalGenerateSuggestedTitles(data.clientId);
  });

export async function internalGenerateSuggestedIdeas(
  clientId: string,
): Promise<SuggestedIdeasPayload> {
  const { llmAvailable } = await import("@/lib/server/analyze.server");
  if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");
  const client = await readClient(clientId);
  const { loadKnowledgeDigest } = await import("@/lib/server/knowledge.server");
  const [videoGlobal, clientIdeas, clientClipping] = await Promise.all([
    loadKnowledgeDigest("VIDEO_GLOBAL"),
    loadKnowledgeDigest("CLIENT_IDEAS", client.id),
    loadKnowledgeDigest("CLIENT_CLIPPING", client.id),
  ]);
  const { generateIdeaSuggestions } = await import("@/lib/server/client-tools-agent.server");
  let payload: SuggestedIdeasPayload;
  try {
    payload = await generateIdeaSuggestions({
      client,
      videoGlobal: [videoGlobal, clientClipping].filter(Boolean).join("\n\n") || videoGlobal,
      clientIdeas,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")
    ) {
      throw error;
    }
    throw new Error("GENERATION_FAILED");
  }
  const stamp = payload.generatedAt;
  await patchSuggestions(client.id, {
    suggested_ideas: JSON.stringify(payload),
    suggested_ideas_at: stamp,
    updated_at: stamp,
  });
  return payload;
}

export const generateSuggestedIdeas = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ clientId: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<SuggestedIdeasPayload> => {
    return internalGenerateSuggestedIdeas(data.clientId);
  });

export const listClientTraining = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ scope: scopeSchema, clientId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<ClientTrainingEntry[]> => {
    await readClient(data.clientId);
    const rows = await readClientEntries(data.scope, data.clientId);
    return rows.map(toTrainingEntry);
  });

export const sendClientTraining = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        scope: scopeSchema,
        clientId: z.string().min(1),
        content: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<ClientTrainingEntry> => {
    const content = cleanTrainingInput(data.content);
    if (!content) throw new Error("EMPTY_MESSAGE");
    if (content.length > MAX_TRAINING_CHARS) throw new Error("KNOWLEDGE_TOO_LARGE");
    const { llmAvailable } = await import("@/lib/server/analyze.server");
    if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");
    await readClient(data.clientId);
    const { extractTrainingPrinciple } = await import("@/lib/server/knowledge.server");
    const label = data.scope === "CLIENT_TITLES" ? "Client title training" : "Client idea training";
    let learned: string;
    try {
      learned = (
        await extractTrainingPrinciple({
          scope: data.scope,
          userInput: content,
          label,
        })
      ).trim();
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")
      ) {
        throw error;
      }
      throw new Error("EXTRACTION_FAILED");
    }
    if (!learned) throw new Error("EXTRACTION_FAILED");
    const stamp = nowIso();
    const entry: KnowledgeEntry = {
      id: newId(),
      scope: data.scope,
      clientId: data.clientId,
      userInput: content,
      learnedPrinciple: learned,
      status: "ACTIVE",
      tags: null,
      timestamp: stamp,
      createdAt: stamp,
      updatedAt: stamp,
      createdBy: context.userId,
      deletedAt: null,
    };
    try {
      await insertEntry({
        id: entry.id,
        scope: entry.scope,
        client_id: data.clientId,
        user_input: entry.userInput,
        learned_principle: entry.learnedPrinciple,
        status: "ACTIVE",
        tags: null,
        timestamp: stamp,
        created_at: stamp,
        updated_at: stamp,
        created_by: context.userId,
        deleted_at: null,
      });
    } catch {
      throw new Error("DATA_UNAVAILABLE");
    }
    return toTrainingEntry(entry);
  });
