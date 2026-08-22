import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { IdeationMessage, IdeationThread } from "@/lib/entities";
import {
  cleanUserMessage,
  titleFromFirstMessage,
  userAskedAboutShorts,
} from "@/lib/ideation";

import {
  isMissingTable,
  mapIdeationMessage,
  mapIdeationThread,
} from "@/lib/server/mappers";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}

export type ThreadListItem = IdeationThread & { clientName: string | null };

export type SendResult = {
  ok: boolean;
  thread: ThreadListItem;
  messages: IdeationMessage[];
  toolsUsed: string[];
  fallback: boolean;
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

function withClientName(thread: IdeationThread, names: Map<string, string>): ThreadListItem {
  return {
    ...thread,
    clientName: thread.clientId ? (names.get(thread.clientId) ?? null) : null,
  };
}

async function readThreads(): Promise<IdeationThread[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("ideation_threads")
      .select("*")
      .eq("status", "ACTIVE")
      .order("updated_at", { ascending: false });
    if (!error) {
      return (data ?? []).map((row) => mapIdeationThread(row as Record<string, unknown>));
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from ideation_threads where status = 'ACTIVE' order by updated_at desc",
  );
  return rows.map(mapIdeationThread);
}

async function readThread(id: string): Promise<IdeationThread | null> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("ideation_threads")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error) {
      return data ? mapIdeationThread(data as Record<string, unknown>) : null;
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from ideation_threads where id = $1",
    [id],
  );
  return rows[0] ? mapIdeationThread(rows[0]) : null;
}

async function readMessages(threadId: string): Promise<IdeationMessage[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("ideation_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("timestamp", { ascending: true });
    if (!error) {
      return (data ?? []).map((row) => mapIdeationMessage(row as Record<string, unknown>));
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from ideation_messages where thread_id = $1 order by timestamp asc",
    [threadId],
  );
  return rows.map(mapIdeationMessage);
}

async function insertThread(row: {
  id: string;
  title: string;
  client_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("ideation_threads").insert(row);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into ideation_threads (id, title, client_id, status, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$5,$6)`,
    [row.id, row.title, row.client_id, row.status, row.created_at, row.created_by],
  );
}

async function insertMessage(row: {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  timestamp: string;
  metadata: unknown;
  created_at: string;
  updated_at: string;
  created_by: string;
}): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  const metadata = row.metadata == null ? null : JSON.stringify(row.metadata);
  if (admin) {
    const { error } = await admin.from("ideation_messages").insert({
      ...row,
      metadata: row.metadata ?? null,
    });
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into ideation_messages
      (id, thread_id, role, content, timestamp, metadata, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$7,$8)`,
    [
      row.id,
      row.thread_id,
      row.role,
      row.content,
      row.timestamp,
      metadata,
      row.created_at,
      row.created_by,
    ],
  );
}

async function patchThread(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("ideation_threads").update(patch).eq("id", id);
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
  await sql.query(
    `update ideation_threads set ${sets.join(", ")} where id = $${i}`,
    values,
  );
}

async function decorate(thread: IdeationThread): Promise<ThreadListItem> {
  const names = await clientNameMap();
  return withClientName(thread, names);
}

export const listIdeationThreads = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<ThreadListItem[]> => {
    const [threads, names] = await Promise.all([readThreads(), clientNameMap()]);
    return threads.map((thread) => withClientName(thread, names));
  });

export const listIdeationMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }): Promise<IdeationMessage[]> => {
    const thread = await readThread(id);
    if (!thread) throw new Error("THREAD_MISSING");
    return readMessages(id);
  });

export const renameIdeationThread = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string().min(1), title: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<ThreadListItem> => {
    const thread = await readThread(data.id);
    if (!thread) throw new Error("THREAD_MISSING");
    const stamp = nowIso();
    await patchThread(data.id, { title: data.title, updated_at: stamp });
    return decorate({ ...thread, title: data.title, updatedAt: stamp });
  });

export const tagIdeationThread = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        clientId: z.string().min(1).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ThreadListItem> => {
    const thread = await readThread(data.id);
    if (!thread) throw new Error("THREAD_MISSING");
    const stamp = nowIso();
    await patchThread(data.id, { client_id: data.clientId, updated_at: stamp });
    return decorate({ ...thread, clientId: data.clientId, updatedAt: stamp });
  });

export const archiveIdeationThread = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }): Promise<{ id: string }> => {
    const thread = await readThread(id);
    if (!thread) throw new Error("THREAD_MISSING");
    await patchThread(id, { status: "ARCHIVED", updated_at: nowIso() });
    return { id };
  });

export const deleteIdeationThread = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }): Promise<{ id: string }> => {
    const thread = await readThread(id);
    if (!thread) throw new Error("THREAD_MISSING");
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (admin) {
      const messages = await admin.from("ideation_messages").delete().eq("thread_id", id);
      const threads = await admin.from("ideation_threads").delete().eq("id", id);
      if (!messages.error && !threads.error) return { id };
      if (
        !isMissingTable(messages.error) &&
        !isMissingTable(threads.error) &&
        (messages.error || threads.error)
      ) {
        throw new Error("DATA_UNAVAILABLE");
      }
    }
    const sql = await (await load_agency_db()).localSql();
    await sql.query("delete from ideation_messages where thread_id = $1", [id]);
    await sql.query("delete from ideation_threads where id = $1", [id]);
    return { id };
  });

async function generateReply(
  thread: IdeationThread,
  history: IdeationMessage[],
  userId: string,
): Promise<{ messages: IdeationMessage[]; toolsUsed: string[]; fallback: boolean }> {
  const { llmAvailable } = await import("@/lib/server/analyze.server");
  if (!(await llmAvailable())) {
    return { messages: history, toolsUsed: [], fallback: true };
  }
  const agent = await import("@/lib/server/ideation-agent.server");
  const lastUser = [...history].reverse().find((row) => row.role === "user");
  const firstUser = history.find((row) => row.role === "user");
  const isFirstTurn = history.filter((row) => row.role === "user").length === 1;
  const [knowledgeDigest, clientSummary] = await Promise.all([
    agent.loadVideoKnowledgeDigest(thread.clientId ?? undefined),
    thread.clientId ? agent.loadClientSummary(thread.clientId) : Promise.resolve(null),
  ]);
  const titlePromise =
    isFirstTurn && firstUser
      ? agent.suggestThreadTitle(firstUser.content)
      : Promise.resolve(null);
  const result = await agent.runIdeationAgent(history, {
    knowledgeDigest,
    clientSummary,
    includeShorts: lastUser ? userAskedAboutShorts(lastUser.content) : false,
  });
  const stamp = nowIso();
  const assistant: IdeationMessage = {
    id: newId(),
    threadId: thread.id,
    role: "assistant",
    content: result.text,
    timestamp: stamp,
    metadata: result.toolsUsed.length ? { toolsUsed: result.toolsUsed } : null,
    createdAt: stamp,
    updatedAt: stamp,
    createdBy: userId,
  };
  await insertMessage({
    id: assistant.id,
    thread_id: assistant.threadId,
    role: assistant.role,
    content: assistant.content,
    timestamp: assistant.timestamp,
    metadata: assistant.metadata,
    created_at: stamp,
    updated_at: stamp,
    created_by: userId,
  });
  await patchThread(thread.id, { updated_at: stamp });
  const generatedTitle = await titlePromise;
  if (generatedTitle && generatedTitle !== thread.title) {
    await patchThread(thread.id, { title: generatedTitle, updated_at: stamp });
    thread.title = generatedTitle;
  }
  return { messages: [...history, assistant], toolsUsed: result.toolsUsed, fallback: false };
}

export const sendIdeationMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        threadId: z.string().min(1).optional(),
        content: z.string().max(8000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<SendResult> => {
    const content = cleanUserMessage(data.content);
    if (!content) throw new Error("EMPTY_MESSAGE");
    const stamp = nowIso();
    let thread = data.threadId ? await readThread(data.threadId) : null;
    if (data.threadId && !thread) throw new Error("THREAD_MISSING");
    if (!thread) {
      thread = {
        id: newId(),
        title: titleFromFirstMessage(content),
        clientId: null,
        status: "ACTIVE",
        createdAt: stamp,
        updatedAt: stamp,
        createdBy: context.userId,
      };
      await insertThread({
        id: thread.id,
        title: thread.title,
        client_id: null,
        status: "ACTIVE",
        created_at: stamp,
        updated_at: stamp,
        created_by: context.userId,
      });
    }
    const userMsg: IdeationMessage = {
      id: newId(),
      threadId: thread.id,
      role: "user",
      content,
      timestamp: stamp,
      metadata: null,
      createdAt: stamp,
      updatedAt: stamp,
      createdBy: context.userId,
    };
    await insertMessage({
      id: userMsg.id,
      thread_id: thread.id,
      role: "user",
      content,
      timestamp: stamp,
      metadata: null,
      created_at: stamp,
      updated_at: stamp,
      created_by: context.userId,
    });
    const history = [...(await readMessages(thread.id))];
    const decorated = await decorate({ ...thread, updatedAt: stamp });
    try {
      const reply = await generateReply(thread, history, context.userId);
      const latest = await readThread(thread.id);
      return {
        ok: !reply.fallback,
        thread: await decorate(latest ?? thread),
        messages: reply.messages,
        toolsUsed: reply.toolsUsed,
        fallback: reply.fallback,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "AI_UNAVAILABLE") {
        return {
          ok: false,
          thread: decorated,
          messages: history,
          toolsUsed: [],
          fallback: true,
        };
      }
      return {
        ok: false,
        thread: decorated,
        messages: history,
        toolsUsed: [],
        fallback: false,
      };
    }
  });

export const retryIdeationTurn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id, context }): Promise<SendResult> => {
    const thread = await readThread(id);
    if (!thread) throw new Error("THREAD_MISSING");
    const history = await readMessages(id);
    const last = history[history.length - 1];
    if (!last || last.role !== "user") {
      return {
        ok: true,
        thread: await decorate(thread),
        messages: history,
        toolsUsed: [],
        fallback: false,
      };
    }
    try {
      const reply = await generateReply(thread, history, context.userId);
      const latest = await readThread(thread.id);
      return {
        ok: !reply.fallback,
        thread: await decorate(latest ?? thread),
        messages: reply.messages,
        toolsUsed: reply.toolsUsed,
        fallback: reply.fallback,
      };
    } catch {
      return {
        ok: false,
        thread: await decorate(thread),
        messages: history,
        toolsUsed: [],
        fallback: false,
      };
    }
  });
