import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { KnowledgeEntry } from "@/lib/entities";
import {
  KNOWLEDGE_LIST_MAX,
  MAX_TRAINING_CHARS,
  TRAINING_SCOPES,
  cleanTrainingInput,
  type TrainingScope,
} from "@/lib/knowledge";

import { isMissingTable, mapKnowledgeEntry } from "@/lib/server/mappers";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}

export type TrainingEntry = Pick<
  KnowledgeEntry,
  "id" | "scope" | "userInput" | "learnedPrinciple" | "timestamp" | "createdAt"
>;

const scopeSchema = z.enum(TRAINING_SCOPES);

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function toTrainingEntry(row: KnowledgeEntry): TrainingEntry {
  return {
    id: row.id,
    scope: row.scope,
    userInput: row.userInput,
    learnedPrinciple: row.learnedPrinciple,
    timestamp: row.timestamp,
    createdAt: row.createdAt,
  };
}

async function readActiveEntries(scope: TrainingScope): Promise<KnowledgeEntry[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("knowledge_entries")
      .select("*")
      .eq("scope", scope)
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
     where scope = $1 and status = 'ACTIVE' and deleted_at is null
     order by timestamp asc nulls last, created_at asc
     limit $2`,
    [scope, KNOWLEDGE_LIST_MAX],
  );
  return rows.map(mapKnowledgeEntry);
}

async function insertEntry(row: {
  id: string;
  scope: string;
  client_id: string | null;
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

export const listKnowledgeEntries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ scope: scopeSchema }).parse(input))
  .handler(async ({ data }): Promise<TrainingEntry[]> => {
    const rows = await readActiveEntries(data.scope);
    return rows.map(toTrainingEntry);
  });

export const sendTrainingMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ scope: scopeSchema, content: z.string() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<TrainingEntry> => {
    const content = cleanTrainingInput(data.content);
    if (!content) throw new Error("EMPTY_MESSAGE");
    if (content.length > MAX_TRAINING_CHARS) throw new Error("KNOWLEDGE_TOO_LARGE");
    const { llmAvailable } = await import("@/lib/server/analyze.server");
    if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");
    const { extractTrainingPrinciple } = await import("@/lib/server/knowledge.server");
    let learned: string;
    try {
      learned = (await extractTrainingPrinciple({ scope: data.scope, userInput: content })).trim();
    } catch (error) {
      if (error instanceof Error && (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")) {
        throw error;
      }
      throw new Error("EXTRACTION_FAILED");
    }
    if (!learned) throw new Error("EXTRACTION_FAILED");
    const stamp = nowIso();
    const entry: KnowledgeEntry = {
      id: newId(),
      scope: data.scope,
      clientId: null,
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
        client_id: null,
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

export const summarizeKnowledge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ scope: scopeSchema }).parse(input))
  .handler(async ({ data }): Promise<{ summary: string; count: number }> => {
    const { llmAvailable } = await import("@/lib/server/analyze.server");
    if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");
    const { loadActivePrinciples, summarizeTrainingKnowledge } = await import(
      "@/lib/server/knowledge.server"
    );
    const rows = await loadActivePrinciples(data.scope, KNOWLEDGE_LIST_MAX);
    const principles = rows.map((row) => row.learnedPrinciple).filter(Boolean);
    if (!principles.length) {
      return { summary: "No active training yet for this scope.", count: 0 };
    }
    try {
      const summary = await summarizeTrainingKnowledge({
        scope: data.scope,
        principles,
      });
      return { summary, count: principles.length };
    } catch (error) {
      if (error instanceof Error && (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")) {
        throw error;
      }
      throw new Error("GENERATION_FAILED");
    }
  });

export const resetKnowledge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ scope: scopeSchema, confirm: z.literal(true) }).parse(input),
  )
  .handler(async ({ context, data }): Promise<{ scope: TrainingScope; cleared: number }> => {
    const stamp = nowIso();
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (admin) {
      const { data: rows, error } = await admin
        .from("knowledge_entries")
        .update({
          status: "DEPRECATED",
          deleted_at: stamp,
          updated_at: stamp,
        })
        .eq("scope", data.scope)
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .select("id");
      if (!error) {
        const cleared = rows?.length ?? 0;
        void import("@/lib/server/audit.server")
          .then((mod) =>
            mod.writeAuditEvent({
              actorUserId: context.userId,
              actorType: "USER",
              action: "knowledge.reset",
              entityType: "knowledge_entry",
              entityId: data.scope,
              summary: `Knowledge reset (${data.scope})`,
              metadata: { cleared },
            }),
          )
          .catch(() => {});
        return { scope: data.scope, cleared };
      }
      if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    }
    const sql = await (await load_agency_db()).localSql();
    const updated = await sql.query<{ id: string }>(
      `update knowledge_entries
       set status = 'DEPRECATED', deleted_at = $2, updated_at = $2
       where scope = $1 and status = 'ACTIVE' and deleted_at is null
       returning id`,
      [data.scope, stamp],
    );
    void import("@/lib/server/audit.server")
      .then((mod) =>
        mod.writeAuditEvent({
          actorUserId: context.userId,
          actorType: "USER",
          action: "knowledge.reset",
          entityType: "knowledge_entry",
          entityId: data.scope,
          summary: `Knowledge reset (${data.scope})`,
          metadata: { cleared: updated.length },
        }),
      )
      .catch(() => {});
    return { scope: data.scope, cleared: updated.length };
  });
