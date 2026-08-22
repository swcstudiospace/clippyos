import { Jt as object, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, H as mapThumbnailSession, V as mapThumbnailMessage } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { c as isTrustedImageUrl, o as VARIATION_HINTS, s as cleanThumbnailMessage, t as MAX_OVERLAY_DATA_CHARS, u as titleFromThumbnailPrompt } from "./thumbnails-DY2H9c6H.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/thumbnails-Clb0nN5X.js
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
async function assertActiveClient(clientId) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("clients").select("id,status,deleted_at").eq("id", clientId).maybeSingle();
		if (!error) {
			const record = data;
			if (!record?.id || record.deleted_at || record.status === "CHURNED") throw new Error("CLIENT_MISSING");
			return;
		}
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const row = (await (await (await load_agency_db()).localSql()).query("select id, status, deleted_at from clients where id = $1", [clientId]))[0];
	if (!row || row.deleted_at || row.status === "CHURNED") throw new Error("CLIENT_MISSING");
}
async function readSessions() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("thumbnail_sessions").select("*").eq("status", "ACTIVE").order("updated_at", { ascending: false });
		if (!error) return (data ?? []).map((row) => mapThumbnailSession(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from thumbnail_sessions where status = 'ACTIVE' order by updated_at desc")).map(mapThumbnailSession);
}
async function readSession(id) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("thumbnail_sessions").select("*").eq("id", id).maybeSingle();
		if (!error) return data ? mapThumbnailSession(data) : null;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const rows = await (await (await load_agency_db()).localSql()).query("select * from thumbnail_sessions where id = $1", [id]);
	return rows[0] ? mapThumbnailSession(rows[0]) : null;
}
async function readMessages(sessionId) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("thumbnail_messages").select("*").eq("session_id", sessionId).order("timestamp", { ascending: true });
		if (!error) return (data ?? []).map((row) => mapThumbnailMessage(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from thumbnail_messages where session_id = $1 order by timestamp asc", [sessionId])).map(mapThumbnailMessage);
}
async function messageStats(sessionIds) {
	const stats = /* @__PURE__ */ new Map();
	for (const id of sessionIds) stats.set(id, {
		imageCount: 0,
		ratings: []
	});
	if (sessionIds.length === 0) return new Map([...stats.entries()].map(([id, value]) => [id, {
		imageCount: value.imageCount,
		avgRating: null
	}]));
	const admin = await (await load_agency_db()).getAgencyAdmin();
	let rows = [];
	let remoteOk = false;
	if (admin) {
		const { data, error } = await admin.from("thumbnail_messages").select("session_id,image_url,rating");
		if (!error) {
			rows = data ?? [];
			remoteOk = true;
		} else if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	if (!remoteOk) try {
		rows = await (await (await load_agency_db()).localSql()).query("select session_id, image_url, rating from thumbnail_messages");
	} catch {}
	for (const row of rows) {
		const current = stats.get(row.session_id);
		if (!current) continue;
		if (row.image_url) current.imageCount += 1;
		if (row.rating != null) current.ratings.push(Number(row.rating));
	}
	const result = /* @__PURE__ */ new Map();
	for (const [id, value] of stats) {
		const avg = value.ratings.length === 0 ? null : value.ratings.reduce((sum, n) => sum + n, 0) / value.ratings.length;
		result.set(id, {
			imageCount: value.imageCount,
			avgRating: avg
		});
	}
	return result;
}
async function decorate(session) {
	const [names, stats] = await Promise.all([clientNameMap(), messageStats([session.id])]);
	const row = stats.get(session.id) ?? {
		imageCount: 0,
		avgRating: null
	};
	return {
		...session,
		clientName: names.get(session.clientId) ?? null,
		imageCount: row.imageCount,
		avgRating: row.avgRating
	};
}
async function insertSession(row) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("thumbnail_sessions").insert(row);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await (await load_agency_db()).localSql()).query(`insert into thumbnail_sessions (id, client_id, title, status, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$5,$6)`, [
		row.id,
		row.client_id,
		row.title,
		row.status,
		row.created_at,
		row.created_by
	]);
}
async function insertMessage(row) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	const metadata = row.metadata == null ? null : JSON.stringify(row.metadata);
	if (admin) {
		const { error } = await admin.from("thumbnail_messages").insert({
			...row,
			metadata: row.metadata ?? null
		});
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await (await load_agency_db()).localSql()).query(`insert into thumbnail_messages
      (id, session_id, role, content, image_url, rating, timestamp, metadata, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10)`, [
		row.id,
		row.session_id,
		row.role,
		row.content,
		row.image_url,
		row.rating,
		row.timestamp,
		metadata,
		row.created_at,
		row.created_by
	]);
}
async function patchSession(id, patch) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("thumbnail_sessions").update(patch).eq("id", id);
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
	await sql.query(`update thumbnail_sessions set ${sets.join(", ")} where id = $${i}`, values);
}
async function patchMessage(id, patch) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	const payload = { ...patch };
	if ("metadata" in payload && payload.metadata && typeof payload.metadata === "object") {}
	if (admin) {
		const { error } = await admin.from("thumbnail_messages").update(payload).eq("id", id);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await (await load_agency_db()).localSql();
	const sets = [];
	const values = [];
	let i = 1;
	for (const [key, value] of Object.entries(patch)) {
		sets.push(`${key} = $${i}`);
		values.push(key === "metadata" && value && typeof value === "object" ? JSON.stringify(value) : value);
		i += 1;
	}
	values.push(id);
	await sql.query(`update thumbnail_messages set ${sets.join(", ")} where id = $${i}`, values);
}
var listThumbnailSessions_createServerFn_handler = createServerRpc({
	id: "5dd37fc6884b66a535ad5532d340696459eb8efb52b8a62bf67fc3e31925084c",
	name: "listThumbnailSessions",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => listThumbnailSessions.__executeServer(opts));
var listThumbnailSessions = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listThumbnailSessions_createServerFn_handler, async () => {
	const [sessions, names] = await Promise.all([readSessions(), clientNameMap()]);
	const stats = await messageStats(sessions.map((row) => row.id));
	return sessions.map((session) => {
		const row = stats.get(session.id) ?? {
			imageCount: 0,
			avgRating: null
		};
		return {
			...session,
			clientName: names.get(session.clientId) ?? null,
			imageCount: row.imageCount,
			avgRating: row.avgRating
		};
	});
});
var listThumbnailMessages_createServerFn_handler = createServerRpc({
	id: "817faaa1d68fe19e0ca6c58b583e5193646d2d694bb1bbad6b3d6a896541e06d",
	name: "listThumbnailMessages",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => listThumbnailMessages.__executeServer(opts));
var listThumbnailMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(listThumbnailMessages_createServerFn_handler, async ({ data: id }) => {
	if (!await readSession(id)) throw new Error("SESSION_MISSING");
	return readMessages(id);
});
var renameThumbnailSession_createServerFn_handler = createServerRpc({
	id: "f0cf4f2f50e802a2af7e9d4bc5f9a399e02e844fcc1b10708ffbabb4be1335f1",
	name: "renameThumbnailSession",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => renameThumbnailSession.__executeServer(opts));
var renameThumbnailSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	title: string().trim().min(1).max(120)
}).parse(input)).handler(renameThumbnailSession_createServerFn_handler, async ({ data }) => {
	const session = await readSession(data.id);
	if (!session) throw new Error("SESSION_MISSING");
	const stamp = nowIso();
	await patchSession(data.id, {
		title: data.title,
		updated_at: stamp
	});
	return decorate({
		...session,
		title: data.title,
		updatedAt: stamp
	});
});
var archiveThumbnailSession_createServerFn_handler = createServerRpc({
	id: "66490721ca794db8b5d8b9cf4883d8b3594668f7572260b693db15d88c23b47e",
	name: "archiveThumbnailSession",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => archiveThumbnailSession.__executeServer(opts));
var archiveThumbnailSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(archiveThumbnailSession_createServerFn_handler, async ({ data: id }) => {
	if (!await readSession(id)) throw new Error("SESSION_MISSING");
	await patchSession(id, {
		status: "ARCHIVED",
		updated_at: nowIso()
	});
	return { id };
});
var deleteThumbnailSession_createServerFn_handler = createServerRpc({
	id: "b1981e49c703bacea43a4c6d2ee4691452ceb78c37c8e3b600ca047abb43c634",
	name: "deleteThumbnailSession",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => deleteThumbnailSession.__executeServer(opts));
var deleteThumbnailSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(deleteThumbnailSession_createServerFn_handler, async ({ data: id }) => {
	if (!await readSession(id)) throw new Error("SESSION_MISSING");
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const messages = await admin.from("thumbnail_messages").delete().eq("session_id", id);
		const sessions = await admin.from("thumbnail_sessions").delete().eq("id", id);
		if (!messages.error && !sessions.error) return { id };
		if (!isMissingTable(messages.error) && !isMissingTable(sessions.error) && (messages.error || sessions.error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await (await load_agency_db()).localSql();
	await sql.query("delete from thumbnail_messages where session_id = $1", [id]);
	await sql.query("delete from thumbnail_sessions where id = $1", [id]);
	return { id };
});
async function writeAssistant(params) {
	const stamp = nowIso();
	const message = {
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
		createdBy: params.userId
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
		created_by: params.userId
	});
	await patchSession(params.sessionId, { updated_at: stamp });
	return message;
}
var sendThumbnailMessage_createServerFn_handler = createServerRpc({
	id: "65ecbbcd0fbf7d098beed7070cc0e531ade051e1b13c0ff03df2321f7016fc23",
	name: "sendThumbnailMessage",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => sendThumbnailMessage.__executeServer(opts));
var sendThumbnailMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	sessionId: string().min(1).optional(),
	clientId: string().min(1),
	content: string().max(4e3)
}).parse(input)).handler(sendThumbnailMessage_createServerFn_handler, async ({ data, context }) => {
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
			createdBy: context.userId
		};
		await insertSession({
			id: session.id,
			client_id: session.clientId,
			title: session.title,
			status: "ACTIVE",
			created_at: stamp,
			updated_at: stamp,
			created_by: context.userId
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
		created_by: context.userId
	});
	const history = await readMessages(session.id);
	const decorated = await decorate({
		...session,
		updatedAt: stamp
	});
	const { llmAvailable } = await import("./analyze.server-CGOV0UvB.mjs");
	const { imageGenAvailable } = await import("./higgsfield.server-DqdavdNF.mjs").then((n) => n.n).then((n) => n.n);
	const imageReady = await imageGenAvailable();
	if (!await llmAvailable()) return {
		ok: false,
		session: decorated,
		messages: history,
		pendingImageId: null,
		fallback: true,
		imageFallback: !imageReady
	};
	try {
		const agent = await import("./thumbnails-agent.server-CPcEuEdc.mjs");
		const ideationAgent = await import("./ideation-agent.server-CGfEDYJM.mjs");
		const isFirstTurn = history.filter((row) => row.role === "user").length === 1;
		const [knowledge, clientSummary] = await Promise.all([agent.loadThumbnailKnowledge(), ideationAgent.loadClientSummary(session.clientId)]);
		const titlePromise = isFirstTurn ? agent.suggestSessionTitle(content) : Promise.resolve(null);
		const direction = await agent.runThumbnailDirection(history, clientSummary, knowledge);
		const assistant = await writeAssistant({
			sessionId: session.id,
			userId: context.userId,
			content: direction.direction,
			imageUrl: null,
			metadata: {
				kind: "turn",
				imagePrompt: direction.imagePrompt
			}
		});
		const generatedTitle = await titlePromise;
		if (generatedTitle && generatedTitle !== session.title) {
			await patchSession(session.id, {
				title: generatedTitle,
				updated_at: nowIso()
			});
			session.title = generatedTitle;
		}
		return {
			ok: true,
			session: await decorate(await readSession(session.id) ?? session),
			messages: [...history, assistant],
			pendingImageId: assistant.id,
			fallback: false,
			imageFallback: !imageReady
		};
	} catch (error) {
		if (error instanceof Error && error.message === "AI_UNAVAILABLE") return {
			ok: false,
			session: decorated,
			messages: history,
			pendingImageId: null,
			fallback: true,
			imageFallback: !imageReady
		};
		if (error instanceof Error && error.message === "AI_RATE_LIMIT") throw error;
		return {
			ok: false,
			session: decorated,
			messages: history,
			pendingImageId: null,
			fallback: false,
			imageFallback: !imageReady
		};
	}
});
var generateThumbnailImageFn_createServerFn_handler = createServerRpc({
	id: "0197e1077d91b09e480867a7fdf437e69b956fabdd36260654b1f56a9c9a3a85",
	name: "generateThumbnailImageFn",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => generateThumbnailImageFn.__executeServer(opts));
var generateThumbnailImageFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	messageId: string().min(1),
	variationHint: string().max(400).optional()
}).parse(input)).handler(generateThumbnailImageFn_createServerFn_handler, async ({ data }) => {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	let message = null;
	if (admin) {
		const { data: row, error } = await admin.from("thumbnail_messages").select("*").eq("id", data.messageId).maybeSingle();
		if (!error && row) message = mapThumbnailMessage(row);
		if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	if (!message) {
		const rows = await (await (await load_agency_db()).localSql()).query("select * from thumbnail_messages where id = $1", [data.messageId]);
		message = rows[0] ? mapThumbnailMessage(rows[0]) : null;
	}
	if (!message) throw new Error("SESSION_MISSING");
	const session = await readSession(message.sessionId);
	if (!session) throw new Error("SESSION_MISSING");
	const { generateThumbnailImage, imageGenAvailable } = await import("./higgsfield.server-DqdavdNF.mjs").then((n) => n.n).then((n) => n.n);
	if (!await imageGenAvailable()) {
		const meta = {
			...message.metadata ?? {},
			imageFailed: true
		};
		await patchMessage(message.id, {
			metadata: meta,
			updated_at: nowIso()
		});
		return {
			ok: false,
			session: await decorate(session),
			messages: await readMessages(session.id),
			pendingImageId: message.id,
			fallback: false,
			imageFallback: true
		};
	}
	const basePrompt = message.metadata?.imagePrompt || message.content || "16:9 YouTube thumbnail, 4K, bold readable text at small sizes, high contrast";
	const result = await generateThumbnailImage(data.variationHint ? `${basePrompt}\n${data.variationHint}` : basePrompt);
	const stamp = nowIso();
	if (result.ok && isTrustedImageUrl(result.url)) {
		const meta = {
			...message.metadata ?? {},
			imageFailed: void 0,
			imagePrompt: basePrompt
		};
		await patchMessage(message.id, {
			image_url: result.url,
			metadata: meta,
			updated_at: stamp
		});
	} else {
		const meta = {
			...message.metadata ?? {},
			imageFailed: true
		};
		await patchMessage(message.id, {
			metadata: meta,
			updated_at: stamp
		});
	}
	await patchSession(session.id, { updated_at: stamp });
	return {
		ok: result.ok,
		session: await decorate(session),
		messages: await readMessages(session.id),
		pendingImageId: result.ok ? null : message.id,
		fallback: false,
		imageFallback: !result.ok && result.error === "missing"
	};
});
var regenerateThumbnail_createServerFn_handler = createServerRpc({
	id: "afd76a6f98a111496aa0b0559b7e09b21bedc0f69d04c3c63878cc225082e676",
	name: "regenerateThumbnail",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => regenerateThumbnail.__executeServer(opts));
var regenerateThumbnail = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ messageId: string().min(1) }).parse(input)).handler(regenerateThumbnail_createServerFn_handler, async ({ data, context }) => {
	const messages = await (async () => {
		const sqlProbe = await (await load_agency_db()).localSql();
		const admin = await (await load_agency_db()).getAgencyAdmin();
		if (admin) {
			const { data: row, error } = await admin.from("thumbnail_messages").select("*").eq("id", data.messageId).maybeSingle();
			if (!error && row) return mapThumbnailMessage(row);
		}
		const rows = await sqlProbe.query("select * from thumbnail_messages where id = $1", [data.messageId]);
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
			imagePrompt: prompt
		}
	});
	return {
		ok: true,
		session: await decorate(session),
		messages: await readMessages(session.id),
		pendingImageId: created.id,
		fallback: false,
		imageFallback: false
	};
});
var startThumbnailVariations_createServerFn_handler = createServerRpc({
	id: "7bea6cb94e9a99162736a5aaf41488e014f2ab8d3425305df8eba044bec448b8",
	name: "startThumbnailVariations",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => startThumbnailVariations.__executeServer(opts));
var startThumbnailVariations = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ messageId: string().min(1) }).parse(input)).handler(startThumbnailVariations_createServerFn_handler, async ({ data, context }) => {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	let source = null;
	if (admin) {
		const { data: row, error } = await admin.from("thumbnail_messages").select("*").eq("id", data.messageId).maybeSingle();
		if (!error && row) source = mapThumbnailMessage(row);
	}
	if (!source) {
		const rows = await (await (await load_agency_db()).localSql()).query("select * from thumbnail_messages where id = $1", [data.messageId]);
		source = rows[0] ? mapThumbnailMessage(rows[0]) : null;
	}
	if (!source) throw new Error("SESSION_MISSING");
	const session = await readSession(source.sessionId);
	if (!session) throw new Error("SESSION_MISSING");
	const prompt = source.metadata?.imagePrompt || source.content;
	const created = [];
	for (const hint of VARIATION_HINTS) {
		const row = await writeAssistant({
			sessionId: session.id,
			userId: context.userId,
			content: "Variation",
			imageUrl: null,
			metadata: {
				kind: "variation",
				parentId: source.id,
				imagePrompt: `${prompt}\n${hint}`
			}
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
		variationIds: created.map((row) => row.id)
	};
});
var rateThumbnailMessage_createServerFn_handler = createServerRpc({
	id: "bfefb34afd7e0f7b4e3b114da04ae3c2ddd74af6f31e2905de0e61f84851a16b",
	name: "rateThumbnailMessage",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => rateThumbnailMessage.__executeServer(opts));
var rateThumbnailMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	messageId: string().min(1),
	rating: number().int().min(1).max(5)
}).parse(input)).handler(rateThumbnailMessage_createServerFn_handler, async ({ data }) => {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	let message = null;
	if (admin) {
		const { data: row, error } = await admin.from("thumbnail_messages").select("*").eq("id", data.messageId).maybeSingle();
		if (!error && row) message = mapThumbnailMessage(row);
	}
	if (!message) {
		const rows = await (await (await load_agency_db()).localSql()).query("select * from thumbnail_messages where id = $1", [data.messageId]);
		message = rows[0] ? mapThumbnailMessage(rows[0]) : null;
	}
	if (!message) throw new Error("SESSION_MISSING");
	const stamp = nowIso();
	await patchMessage(message.id, {
		rating: data.rating,
		updated_at: stamp
	});
	await patchSession(message.sessionId, { updated_at: stamp });
	return {
		...message,
		rating: data.rating,
		updatedAt: stamp
	};
});
var OverlaySchema = object({
	sessionId: string().min(1),
	parentId: string().min(1),
	overlayText: string().trim().min(1).max(80),
	imageDataUrl: string().min(20).max(MAX_OVERLAY_DATA_CHARS)
});
var saveThumbnailOverlay_createServerFn_handler = createServerRpc({
	id: "7362edba17c61dce904ca62cbec149654e3be353c09a81762be24f5e31d2136b",
	name: "saveThumbnailOverlay",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => saveThumbnailOverlay.__executeServer(opts));
var saveThumbnailOverlay = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => OverlaySchema.parse(input)).handler(saveThumbnailOverlay_createServerFn_handler, async ({ data, context }) => {
	if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(data.imageDataUrl)) throw new Error("UNTRUSTED_IMAGE");
	if (data.imageDataUrl.length > 18e5) throw new Error("OVERLAY_TOO_LARGE");
	const session = await readSession(data.sessionId);
	if (!session) throw new Error("SESSION_MISSING");
	await writeAssistant({
		sessionId: session.id,
		userId: context.userId,
		content: `Overlay: ${data.overlayText}`,
		imageUrl: data.imageDataUrl,
		metadata: {
			kind: "overlay",
			parentId: data.parentId,
			overlayText: data.overlayText
		}
	});
	return {
		ok: true,
		session: await decorate(session),
		messages: await readMessages(session.id),
		pendingImageId: null,
		fallback: false,
		imageFallback: false
	};
});
var fetchTrustedImage_createServerFn_handler = createServerRpc({
	id: "c8a7a2f567ca31bad896359da4f880ee9c9e54729f2537bbe1166063ef258b24",
	name: "fetchTrustedImage",
	filename: "src/lib/server/thumbnails.ts"
}, (opts) => fetchTrustedImage.__executeServer(opts));
var fetchTrustedImage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ url: string().min(1).max(4e3) }).parse(input)).handler(fetchTrustedImage_createServerFn_handler, async ({ data }) => {
	if (!isTrustedImageUrl(data.url)) throw new Error("UNTRUSTED_IMAGE");
	if (data.url.startsWith("data:image/")) return {
		dataUrl: data.url,
		filename: "thumbnail.png"
	};
	const response = await fetch(data.url, {
		redirect: "follow",
		signal: AbortSignal.timeout(2e4)
	});
	if (!response.ok) throw new Error("IMAGE_FAILED");
	const mime = (response.headers.get("content-type") ?? "image/png").split(";")[0];
	if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(mime)) throw new Error("UNTRUSTED_IMAGE");
	const buffer = Buffer.from(await response.arrayBuffer());
	if (buffer.byteLength > 8e6) throw new Error("OVERLAY_TOO_LARGE");
	const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : mime.split("/")[1] ?? "png";
	return {
		dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
		filename: `thumbnail.${ext}`
	};
});
//#endregion
export { archiveThumbnailSession_createServerFn_handler, deleteThumbnailSession_createServerFn_handler, fetchTrustedImage_createServerFn_handler, generateThumbnailImageFn_createServerFn_handler, listThumbnailMessages_createServerFn_handler, listThumbnailSessions_createServerFn_handler, rateThumbnailMessage_createServerFn_handler, regenerateThumbnail_createServerFn_handler, renameThumbnailSession_createServerFn_handler, saveThumbnailOverlay_createServerFn_handler, sendThumbnailMessage_createServerFn_handler, startThumbnailVariations_createServerFn_handler };
