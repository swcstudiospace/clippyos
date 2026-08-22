import { Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, J as userAskedAboutShorts, M as mapIdeationMessage, N as mapIdeationThread, S as cleanUserMessage, q as titleFromFirstMessage } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ideation-DcFj0X4D.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
function newId() {
	return crypto.randomUUID();
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
async function clientNameMap() {
	const names = /* @__PURE__ */ new Map();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("clients").select("id,name,deleted_at");
		if (!error) {
			for (const row of data ?? []) {
				const record = row;
				if (record.id && !record.deleted_at) names.set(record.id, String(record.name ?? ""));
			}
			return names;
		}
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const rows = await (await (await load_agency_db()).localSql()).query("select id, name from clients where deleted_at is null");
	for (const row of rows) names.set(row.id, row.name);
	return names;
}
function withClientName(thread, names) {
	return {
		...thread,
		clientName: thread.clientId ? names.get(thread.clientId) ?? null : null
	};
}
async function readThreads() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("ideation_threads").select("*").eq("status", "ACTIVE").order("updated_at", { ascending: false });
		if (!error) return (data ?? []).map((row) => mapIdeationThread(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from ideation_threads where status = 'ACTIVE' order by updated_at desc")).map(mapIdeationThread);
}
async function readThread(id) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("ideation_threads").select("*").eq("id", id).maybeSingle();
		if (!error) return data ? mapIdeationThread(data) : null;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const rows = await (await (await load_agency_db()).localSql()).query("select * from ideation_threads where id = $1", [id]);
	return rows[0] ? mapIdeationThread(rows[0]) : null;
}
async function readMessages(threadId) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("ideation_messages").select("*").eq("thread_id", threadId).order("timestamp", { ascending: true });
		if (!error) return (data ?? []).map((row) => mapIdeationMessage(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from ideation_messages where thread_id = $1 order by timestamp asc", [threadId])).map(mapIdeationMessage);
}
async function insertThread(row) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("ideation_threads").insert(row);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await (await load_agency_db()).localSql()).query(`insert into ideation_threads (id, title, client_id, status, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$5,$6)`, [
		row.id,
		row.title,
		row.client_id,
		row.status,
		row.created_at,
		row.created_by
	]);
}
async function insertMessage(row) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	const metadata = row.metadata == null ? null : JSON.stringify(row.metadata);
	if (admin) {
		const { error } = await admin.from("ideation_messages").insert({
			...row,
			metadata: row.metadata ?? null
		});
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await (await load_agency_db()).localSql()).query(`insert into ideation_messages
      (id, thread_id, role, content, timestamp, metadata, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$7,$8)`, [
		row.id,
		row.thread_id,
		row.role,
		row.content,
		row.timestamp,
		metadata,
		row.created_at,
		row.created_by
	]);
}
async function patchThread(id, patch) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("ideation_threads").update(patch).eq("id", id);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await (await load_agency_db()).localSql();
	const sets = [];
	const values = [];
	let i = 1;
	for (const [key, value] of Object.entries(patch)) {
		sets.push(`${key} = $${i}`);
		values.push(value);
		i += 1;
	}
	values.push(id);
	await sql.query(`update ideation_threads set ${sets.join(", ")} where id = $${i}`, values);
}
async function decorate(thread) {
	return withClientName(thread, await clientNameMap());
}
var listIdeationThreads_createServerFn_handler = createServerRpc({
	id: "1bd48d0b42d0aabc0f6b6d9a0ad9e2a0754953b8835bad03cb82e875e63b5126",
	name: "listIdeationThreads",
	filename: "src/lib/server/ideation.ts"
}, (opts) => listIdeationThreads.__executeServer(opts));
var listIdeationThreads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listIdeationThreads_createServerFn_handler, async () => {
	const [threads, names] = await Promise.all([readThreads(), clientNameMap()]);
	return threads.map((thread) => withClientName(thread, names));
});
var listIdeationMessages_createServerFn_handler = createServerRpc({
	id: "c7bbea99801283f0fb93e52642de58f737c8d440d38f0567c25f1f2071eee5fb",
	name: "listIdeationMessages",
	filename: "src/lib/server/ideation.ts"
}, (opts) => listIdeationMessages.__executeServer(opts));
var listIdeationMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(listIdeationMessages_createServerFn_handler, async ({ data: id }) => {
	if (!await readThread(id)) throw new Error("THREAD_MISSING");
	return readMessages(id);
});
var renameIdeationThread_createServerFn_handler = createServerRpc({
	id: "38d3a5187b6841fd0351444740ddb860d4008a917e269f0829121a2e5d99d07f",
	name: "renameIdeationThread",
	filename: "src/lib/server/ideation.ts"
}, (opts) => renameIdeationThread.__executeServer(opts));
var renameIdeationThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	title: string().trim().min(1).max(120)
}).parse(input)).handler(renameIdeationThread_createServerFn_handler, async ({ data }) => {
	const thread = await readThread(data.id);
	if (!thread) throw new Error("THREAD_MISSING");
	const stamp = nowIso();
	await patchThread(data.id, {
		title: data.title,
		updated_at: stamp
	});
	return decorate({
		...thread,
		title: data.title,
		updatedAt: stamp
	});
});
var tagIdeationThread_createServerFn_handler = createServerRpc({
	id: "f2da04d1a306ba905e469e0bcef79f5c1e1231f20c1d14b56bb9253bedaddb12",
	name: "tagIdeationThread",
	filename: "src/lib/server/ideation.ts"
}, (opts) => tagIdeationThread.__executeServer(opts));
var tagIdeationThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	clientId: string().min(1).nullable()
}).parse(input)).handler(tagIdeationThread_createServerFn_handler, async ({ data }) => {
	const thread = await readThread(data.id);
	if (!thread) throw new Error("THREAD_MISSING");
	const stamp = nowIso();
	await patchThread(data.id, {
		client_id: data.clientId,
		updated_at: stamp
	});
	return decorate({
		...thread,
		clientId: data.clientId,
		updatedAt: stamp
	});
});
var archiveIdeationThread_createServerFn_handler = createServerRpc({
	id: "8e1932d9c7067c2c78dec421c52b0affcb135f81f6b3347bf98cb899b72bc7a4",
	name: "archiveIdeationThread",
	filename: "src/lib/server/ideation.ts"
}, (opts) => archiveIdeationThread.__executeServer(opts));
var archiveIdeationThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(archiveIdeationThread_createServerFn_handler, async ({ data: id }) => {
	if (!await readThread(id)) throw new Error("THREAD_MISSING");
	await patchThread(id, {
		status: "ARCHIVED",
		updated_at: nowIso()
	});
	return { id };
});
var deleteIdeationThread_createServerFn_handler = createServerRpc({
	id: "e5ca62b54f5272b2c9f0fcd7b5bf10f60a0cc36bdcc24532e7db1fe5e8a13c0c",
	name: "deleteIdeationThread",
	filename: "src/lib/server/ideation.ts"
}, (opts) => deleteIdeationThread.__executeServer(opts));
var deleteIdeationThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(deleteIdeationThread_createServerFn_handler, async ({ data: id }) => {
	if (!await readThread(id)) throw new Error("THREAD_MISSING");
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const messages = await admin.from("ideation_messages").delete().eq("thread_id", id);
		const threads = await admin.from("ideation_threads").delete().eq("id", id);
		if (!messages.error && !threads.error) return { id };
		if (!isMissingTable(messages.error) && !isMissingTable(threads.error) && (messages.error || threads.error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await (await load_agency_db()).localSql();
	await sql.query("delete from ideation_messages where thread_id = $1", [id]);
	await sql.query("delete from ideation_threads where id = $1", [id]);
	return { id };
});
async function generateReply(thread, history, userId) {
	const { llmAvailable } = await import("./analyze.server-CGOV0UvB.mjs");
	if (!await llmAvailable()) return {
		messages: history,
		toolsUsed: [],
		fallback: true
	};
	const agent = await import("./ideation-agent.server-CGfEDYJM.mjs");
	const lastUser = [...history].reverse().find((row) => row.role === "user");
	const firstUser = history.find((row) => row.role === "user");
	const isFirstTurn = history.filter((row) => row.role === "user").length === 1;
	const [knowledgeDigest, clientSummary] = await Promise.all([agent.loadVideoKnowledgeDigest(thread.clientId ?? void 0), thread.clientId ? agent.loadClientSummary(thread.clientId) : Promise.resolve(null)]);
	const titlePromise = isFirstTurn && firstUser ? agent.suggestThreadTitle(firstUser.content) : Promise.resolve(null);
	const result = await agent.runIdeationAgent(history, {
		knowledgeDigest,
		clientSummary,
		includeShorts: lastUser ? userAskedAboutShorts(lastUser.content) : false
	});
	const stamp = nowIso();
	const assistant = {
		id: newId(),
		threadId: thread.id,
		role: "assistant",
		content: result.text,
		timestamp: stamp,
		metadata: result.toolsUsed.length ? { toolsUsed: result.toolsUsed } : null,
		createdAt: stamp,
		updatedAt: stamp,
		createdBy: userId
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
		created_by: userId
	});
	await patchThread(thread.id, { updated_at: stamp });
	const generatedTitle = await titlePromise;
	if (generatedTitle && generatedTitle !== thread.title) {
		await patchThread(thread.id, {
			title: generatedTitle,
			updated_at: stamp
		});
		thread.title = generatedTitle;
	}
	return {
		messages: [...history, assistant],
		toolsUsed: result.toolsUsed,
		fallback: false
	};
}
var sendIdeationMessage_createServerFn_handler = createServerRpc({
	id: "0e727aea63716fa69b76d7d82f787ebb3edbd0cd92eeaa9df5d00d07dc5a1b6d",
	name: "sendIdeationMessage",
	filename: "src/lib/server/ideation.ts"
}, (opts) => sendIdeationMessage.__executeServer(opts));
var sendIdeationMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	threadId: string().min(1).optional(),
	content: string().max(8e3)
}).parse(input)).handler(sendIdeationMessage_createServerFn_handler, async ({ data, context }) => {
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
			createdBy: context.userId
		};
		await insertThread({
			id: thread.id,
			title: thread.title,
			client_id: null,
			status: "ACTIVE",
			created_at: stamp,
			updated_at: stamp,
			created_by: context.userId
		});
	}
	await insertMessage({
		id: {
			id: newId(),
			threadId: thread.id,
			role: "user",
			content,
			timestamp: stamp,
			metadata: null,
			createdAt: stamp,
			updatedAt: stamp,
			createdBy: context.userId
		}.id,
		thread_id: thread.id,
		role: "user",
		content,
		timestamp: stamp,
		metadata: null,
		created_at: stamp,
		updated_at: stamp,
		created_by: context.userId
	});
	const history = [...await readMessages(thread.id)];
	const decorated = await decorate({
		...thread,
		updatedAt: stamp
	});
	try {
		const reply = await generateReply(thread, history, context.userId);
		const latest = await readThread(thread.id);
		return {
			ok: !reply.fallback,
			thread: await decorate(latest ?? thread),
			messages: reply.messages,
			toolsUsed: reply.toolsUsed,
			fallback: reply.fallback
		};
	} catch (error) {
		if (error instanceof Error && error.message === "AI_UNAVAILABLE") return {
			ok: false,
			thread: decorated,
			messages: history,
			toolsUsed: [],
			fallback: true
		};
		return {
			ok: false,
			thread: decorated,
			messages: history,
			toolsUsed: [],
			fallback: false
		};
	}
});
var retryIdeationTurn_createServerFn_handler = createServerRpc({
	id: "9129291952b904d01cb761f0a379d8332520438cff67f058961feff347c43b50",
	name: "retryIdeationTurn",
	filename: "src/lib/server/ideation.ts"
}, (opts) => retryIdeationTurn.__executeServer(opts));
var retryIdeationTurn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(retryIdeationTurn_createServerFn_handler, async ({ data: id, context }) => {
	const thread = await readThread(id);
	if (!thread) throw new Error("THREAD_MISSING");
	const history = await readMessages(id);
	const last = history[history.length - 1];
	if (!last || last.role !== "user") return {
		ok: true,
		thread: await decorate(thread),
		messages: history,
		toolsUsed: [],
		fallback: false
	};
	try {
		const reply = await generateReply(thread, history, context.userId);
		const latest = await readThread(thread.id);
		return {
			ok: !reply.fallback,
			thread: await decorate(latest ?? thread),
			messages: reply.messages,
			toolsUsed: reply.toolsUsed,
			fallback: reply.fallback
		};
	} catch {
		return {
			ok: false,
			thread: await decorate(thread),
			messages: history,
			toolsUsed: [],
			fallback: false
		};
	}
});
//#endregion
export { archiveIdeationThread_createServerFn_handler, deleteIdeationThread_createServerFn_handler, listIdeationMessages_createServerFn_handler, listIdeationThreads_createServerFn_handler, renameIdeationThread_createServerFn_handler, retryIdeationTurn_createServerFn_handler, sendIdeationMessage_createServerFn_handler, tagIdeationThread_createServerFn_handler };
