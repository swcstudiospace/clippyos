import { Bt as _enum, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, a as CLIENT_TRAINING_SCOPES, j as mapClient, k as isMissingColumn } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-tools-Ct5oM3yi.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
var scopeSchema = _enum(CLIENT_TRAINING_SCOPES);
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
var generateSuggestedTitles = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(createSsrRpc("053cc0676049e96f4733c7480a290140e944e74cb2e3e9a55544d5d2e52328ca"));
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
var generateSuggestedIdeas = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(createSsrRpc("78f1786ff20a721be792a018fed67215aec4db0c86a443bf2b2bc70f13e32878"));
var listClientTraining = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({
	scope: scopeSchema,
	clientId: string().min(1)
}).parse(input)).handler(createSsrRpc("973efea99e70c5a2838e0a58f78b4139b37082e92eb4b4fda1438ba52da0bc11"));
var sendClientTraining = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	scope: scopeSchema,
	clientId: string().min(1),
	content: string()
}).parse(input)).handler(createSsrRpc("9b22d1674e4c64f0d389589f45dd9c2b0190934f88803a0f4afc3977622fbd17"));
//#endregion
export { listClientTraining as a, internalGenerateSuggestedTitles as i, generateSuggestedTitles as n, sendClientTraining as o, internalGenerateSuggestedIdeas as r, generateSuggestedIdeas as t };
