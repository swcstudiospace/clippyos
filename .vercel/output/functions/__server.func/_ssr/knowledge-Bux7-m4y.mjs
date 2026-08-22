import { Bt as _enum, Gt as literal, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, P as mapKnowledgeEntry } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { c as TRAINING_SCOPES, u as cleanTrainingInput } from "./knowledge-DYmG2i4O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/knowledge-Bux7-m4y.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
var scopeSchema = _enum(TRAINING_SCOPES);
function newId() {
	return crypto.randomUUID();
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function toTrainingEntry(row) {
	return {
		id: row.id,
		scope: row.scope,
		userInput: row.userInput,
		learnedPrinciple: row.learnedPrinciple,
		timestamp: row.timestamp,
		createdAt: row.createdAt
	};
}
async function readActiveEntries(scope) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("knowledge_entries").select("*").eq("scope", scope).eq("status", "ACTIVE").is("deleted_at", null).order("timestamp", {
			ascending: true,
			nullsFirst: false
		}).order("created_at", { ascending: true }).limit(500);
		if (!error) return (data ?? []).map((row) => mapKnowledgeEntry(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query(`select * from knowledge_entries
     where scope = $1 and status = 'ACTIVE' and deleted_at is null
     order by timestamp asc nulls last, created_at asc
     limit $2`, [scope, 500])).map(mapKnowledgeEntry);
}
async function insertEntry(row) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("knowledge_entries").insert(row);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await (await load_agency_db()).localSql()).query(`insert into knowledge_entries
      (id, scope, client_id, user_input, learned_principle, status, tags, timestamp,
       created_at, updated_at, created_by, deleted_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11)`, [
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
		row.deleted_at
	]);
}
var listKnowledgeEntries_createServerFn_handler = createServerRpc({
	id: "eabe09fa712c53084c5ae8a43ff0fc123daebab19d18c42c301b848ff5e25b14",
	name: "listKnowledgeEntries",
	filename: "src/lib/server/knowledge.ts"
}, (opts) => listKnowledgeEntries.__executeServer(opts));
var listKnowledgeEntries = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ scope: scopeSchema }).parse(input)).handler(listKnowledgeEntries_createServerFn_handler, async ({ data }) => {
	return (await readActiveEntries(data.scope)).map(toTrainingEntry);
});
var sendTrainingMessage_createServerFn_handler = createServerRpc({
	id: "f1d19845aa50f64cb4a4d6c07f100cabf48f3bda58558335ba32f4a07e8c188f",
	name: "sendTrainingMessage",
	filename: "src/lib/server/knowledge.ts"
}, (opts) => sendTrainingMessage.__executeServer(opts));
var sendTrainingMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	scope: scopeSchema,
	content: string()
}).parse(input)).handler(sendTrainingMessage_createServerFn_handler, async ({ data, context }) => {
	const content = cleanTrainingInput(data.content);
	if (!content) throw new Error("EMPTY_MESSAGE");
	if (content.length > 2e6) throw new Error("KNOWLEDGE_TOO_LARGE");
	const { llmAvailable } = await import("./analyze.server-CGOV0UvB.mjs");
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	const { extractTrainingPrinciple } = await import("./knowledge.server-BRKvcE8y.mjs");
	let learned;
	try {
		learned = (await extractTrainingPrinciple({
			scope: data.scope,
			userInput: content
		})).trim();
	} catch (error) {
		if (error instanceof Error && (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")) throw error;
		throw new Error("EXTRACTION_FAILED");
	}
	if (!learned) throw new Error("EXTRACTION_FAILED");
	const stamp = nowIso();
	const entry = {
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
		deletedAt: null
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
			deleted_at: null
		});
	} catch {
		throw new Error("DATA_UNAVAILABLE");
	}
	return toTrainingEntry(entry);
});
var summarizeKnowledge_createServerFn_handler = createServerRpc({
	id: "96d2268ceb5c7f08c297c1bffa97742db439087c7016e6059aa30a4c759980ba",
	name: "summarizeKnowledge",
	filename: "src/lib/server/knowledge.ts"
}, (opts) => summarizeKnowledge.__executeServer(opts));
var summarizeKnowledge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ scope: scopeSchema }).parse(input)).handler(summarizeKnowledge_createServerFn_handler, async ({ data }) => {
	const { llmAvailable } = await import("./analyze.server-CGOV0UvB.mjs");
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	const { loadActivePrinciples, summarizeTrainingKnowledge } = await import("./knowledge.server-BRKvcE8y.mjs");
	const principles = (await loadActivePrinciples(data.scope, 500)).map((row) => row.learnedPrinciple).filter(Boolean);
	if (!principles.length) return {
		summary: "No active training yet for this scope.",
		count: 0
	};
	try {
		return {
			summary: await summarizeTrainingKnowledge({
				scope: data.scope,
				principles
			}),
			count: principles.length
		};
	} catch (error) {
		if (error instanceof Error && (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")) throw error;
		throw new Error("GENERATION_FAILED");
	}
});
var resetKnowledge_createServerFn_handler = createServerRpc({
	id: "8f96a907679a10e5d6aade6bfb945e1d6ad2d6912566380c71ab94408b8980d6",
	name: "resetKnowledge",
	filename: "src/lib/server/knowledge.ts"
}, (opts) => resetKnowledge.__executeServer(opts));
var resetKnowledge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	scope: scopeSchema,
	confirm: literal(true)
}).parse(input)).handler(resetKnowledge_createServerFn_handler, async ({ context, data }) => {
	const stamp = nowIso();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data: rows, error } = await admin.from("knowledge_entries").update({
			status: "DEPRECATED",
			deleted_at: stamp,
			updated_at: stamp
		}).eq("scope", data.scope).eq("status", "ACTIVE").is("deleted_at", null).select("id");
		if (!error) {
			const cleared = rows?.length ?? 0;
			import("./audit.server-B2Y-2eMJ.mjs").then((mod) => mod.writeAuditEvent({
				actorUserId: context.userId,
				actorType: "USER",
				action: "knowledge.reset",
				entityType: "knowledge_entry",
				entityId: data.scope,
				summary: `Knowledge reset (${data.scope})`,
				metadata: { cleared }
			})).catch(() => {});
			return {
				scope: data.scope,
				cleared
			};
		}
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const updated = await (await (await load_agency_db()).localSql()).query(`update knowledge_entries
       set status = 'DEPRECATED', deleted_at = $2, updated_at = $2
       where scope = $1 and status = 'ACTIVE' and deleted_at is null
       returning id`, [data.scope, stamp]);
	import("./audit.server-B2Y-2eMJ.mjs").then((mod) => mod.writeAuditEvent({
		actorUserId: context.userId,
		actorType: "USER",
		action: "knowledge.reset",
		entityType: "knowledge_entry",
		entityId: data.scope,
		summary: `Knowledge reset (${data.scope})`,
		metadata: { cleared: updated.length }
	})).catch(() => {});
	return {
		scope: data.scope,
		cleared: updated.length
	};
});
//#endregion
export { listKnowledgeEntries_createServerFn_handler, resetKnowledge_createServerFn_handler, sendTrainingMessage_createServerFn_handler, summarizeKnowledge_createServerFn_handler };
