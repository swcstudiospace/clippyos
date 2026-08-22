import { Bt as _enum, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, P as mapKnowledgeEntry, a as CLIENT_TRAINING_SCOPES, j as mapClient, k as isMissingColumn } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { u as cleanTrainingInput } from "./knowledge-DYmG2i4O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-tools-CDo7GGfk.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
var scopeSchema = _enum(CLIENT_TRAINING_SCOPES);
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
		clientId: row.clientId,
		userInput: row.userInput,
		learnedPrinciple: row.learnedPrinciple,
		timestamp: row.timestamp,
		createdAt: row.createdAt
	};
}
async function readClient(id) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("clients").select("*").eq("id", id).maybeSingle();
		if (!error) {
			if (!data) throw new Error("CLIENT_MISSING");
			const client = mapClient(data);
			if (client.deletedAt) throw new Error("CLIENT_MISSING");
			return client;
		}
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const rows = await (await (await load_agency_db()).localSql()).query("select * from clients where id = $1", [id]);
	if (!rows[0]) throw new Error("CLIENT_MISSING");
	const client = mapClient(rows[0]);
	if (client.deletedAt) throw new Error("CLIENT_MISSING");
	return client;
}
async function ensureLocalSuggestionColumns() {
	const sql = await (await load_agency_db()).localSql();
	await sql.query("alter table clients add column if not exists suggested_titles text");
	await sql.query("alter table clients add column if not exists suggested_ideas text");
	await sql.query("alter table clients add column if not exists suggested_titles_at timestamptz");
	await sql.query("alter table clients add column if not exists suggested_ideas_at timestamptz");
}
async function patchSuggestions(id, patch) {
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
		await sql.query(`update clients set ${assignments} where id = $1`, [id, ...keys.map((key) => patch[key])]);
	} catch {
		throw new Error("DATA_UNAVAILABLE");
	}
}
async function readClientEntries(scope, clientId) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("knowledge_entries").select("*").eq("scope", scope).eq("client_id", clientId).eq("status", "ACTIVE").is("deleted_at", null).order("timestamp", {
			ascending: true,
			nullsFirst: false
		}).order("created_at", { ascending: true }).limit(500);
		if (!error) return (data ?? []).map((row) => mapKnowledgeEntry(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query(`select * from knowledge_entries
     where scope = $1 and client_id = $2 and status = 'ACTIVE' and deleted_at is null
     order by timestamp asc nulls last, created_at asc
     limit $3`, [
		scope,
		clientId,
		500
	])).map(mapKnowledgeEntry);
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
async function internalGenerateSuggestedTitles(clientId) {
	const { llmAvailable } = await import("./analyze.server-CGOV0UvB.mjs");
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	const client = await readClient(clientId);
	if (!client.channelUrl) throw new Error("CHANNEL_MISSING");
	const { pickLastLongForm } = await import("./youtube.server-D98qL7z7.mjs");
	let videos;
	try {
		videos = await pickLastLongForm(client.channelUrl, 5);
	} catch {
		throw new Error("YOUTUBE_UNAVAILABLE");
	}
	const { loadKnowledgeDigest } = await import("./knowledge.server-BRKvcE8y.mjs");
	const [videoGlobal, clientTitles, clientClipping] = await Promise.all([
		loadKnowledgeDigest("VIDEO_GLOBAL"),
		loadKnowledgeDigest("CLIENT_TITLES", client.id),
		loadKnowledgeDigest("CLIENT_CLIPPING", client.id)
	]);
	const { generateTitleSuggestions } = await import("./client-tools-agent.server-DUZuzXFW.mjs");
	let payload;
	try {
		payload = await generateTitleSuggestions({
			client,
			videos,
			videoGlobal: [videoGlobal, clientClipping].filter(Boolean).join("\n\n") || videoGlobal,
			clientTitles
		});
	} catch (error) {
		if (error instanceof Error && (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")) throw error;
		throw new Error("GENERATION_FAILED");
	}
	const stamp = payload.generatedAt;
	await patchSuggestions(client.id, {
		suggested_titles: JSON.stringify(payload),
		suggested_titles_at: stamp,
		updated_at: stamp
	});
	return payload;
}
var generateSuggestedTitles_createServerFn_handler = createServerRpc({
	id: "053cc0676049e96f4733c7480a290140e944e74cb2e3e9a55544d5d2e52328ca",
	name: "generateSuggestedTitles",
	filename: "src/lib/server/client-tools.ts"
}, (opts) => generateSuggestedTitles.__executeServer(opts));
var generateSuggestedTitles = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(generateSuggestedTitles_createServerFn_handler, async ({ data }) => {
	return internalGenerateSuggestedTitles(data.clientId);
});
async function internalGenerateSuggestedIdeas(clientId) {
	const { llmAvailable } = await import("./analyze.server-CGOV0UvB.mjs");
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	const client = await readClient(clientId);
	const { loadKnowledgeDigest } = await import("./knowledge.server-BRKvcE8y.mjs");
	const [videoGlobal, clientIdeas, clientClipping] = await Promise.all([
		loadKnowledgeDigest("VIDEO_GLOBAL"),
		loadKnowledgeDigest("CLIENT_IDEAS", client.id),
		loadKnowledgeDigest("CLIENT_CLIPPING", client.id)
	]);
	const { generateIdeaSuggestions } = await import("./client-tools-agent.server-DUZuzXFW.mjs");
	let payload;
	try {
		payload = await generateIdeaSuggestions({
			client,
			videoGlobal: [videoGlobal, clientClipping].filter(Boolean).join("\n\n") || videoGlobal,
			clientIdeas
		});
	} catch (error) {
		if (error instanceof Error && (error.message === "AI_UNAVAILABLE" || error.message === "AI_RATE_LIMIT")) throw error;
		throw new Error("GENERATION_FAILED");
	}
	const stamp = payload.generatedAt;
	await patchSuggestions(client.id, {
		suggested_ideas: JSON.stringify(payload),
		suggested_ideas_at: stamp,
		updated_at: stamp
	});
	return payload;
}
var generateSuggestedIdeas_createServerFn_handler = createServerRpc({
	id: "78f1786ff20a721be792a018fed67215aec4db0c86a443bf2b2bc70f13e32878",
	name: "generateSuggestedIdeas",
	filename: "src/lib/server/client-tools.ts"
}, (opts) => generateSuggestedIdeas.__executeServer(opts));
var generateSuggestedIdeas = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(generateSuggestedIdeas_createServerFn_handler, async ({ data }) => {
	return internalGenerateSuggestedIdeas(data.clientId);
});
var listClientTraining_createServerFn_handler = createServerRpc({
	id: "973efea99e70c5a2838e0a58f78b4139b37082e92eb4b4fda1438ba52da0bc11",
	name: "listClientTraining",
	filename: "src/lib/server/client-tools.ts"
}, (opts) => listClientTraining.__executeServer(opts));
var listClientTraining = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({
	scope: scopeSchema,
	clientId: string().min(1)
}).parse(input)).handler(listClientTraining_createServerFn_handler, async ({ data }) => {
	await readClient(data.clientId);
	return (await readClientEntries(data.scope, data.clientId)).map(toTrainingEntry);
});
var sendClientTraining_createServerFn_handler = createServerRpc({
	id: "9b22d1674e4c64f0d389589f45dd9c2b0190934f88803a0f4afc3977622fbd17",
	name: "sendClientTraining",
	filename: "src/lib/server/client-tools.ts"
}, (opts) => sendClientTraining.__executeServer(opts));
var sendClientTraining = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	scope: scopeSchema,
	clientId: string().min(1),
	content: string()
}).parse(input)).handler(sendClientTraining_createServerFn_handler, async ({ data, context }) => {
	const content = cleanTrainingInput(data.content);
	if (!content) throw new Error("EMPTY_MESSAGE");
	if (content.length > 2e6) throw new Error("KNOWLEDGE_TOO_LARGE");
	const { llmAvailable } = await import("./analyze.server-CGOV0UvB.mjs");
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	await readClient(data.clientId);
	const { extractTrainingPrinciple } = await import("./knowledge.server-BRKvcE8y.mjs");
	const label = data.scope === "CLIENT_TITLES" ? "Client title training" : "Client idea training";
	let learned;
	try {
		learned = (await extractTrainingPrinciple({
			scope: data.scope,
			userInput: content,
			label
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
		clientId: data.clientId,
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
			client_id: data.clientId,
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
//#endregion
export { generateSuggestedIdeas_createServerFn_handler, generateSuggestedTitles_createServerFn_handler, listClientTraining_createServerFn_handler, sendClientTraining_createServerFn_handler };
