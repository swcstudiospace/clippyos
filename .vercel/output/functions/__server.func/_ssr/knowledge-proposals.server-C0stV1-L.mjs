import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { O as principleHash, d as PROPOSAL_SCOPES, f as PROPOSAL_SOURCES, m as SCOPE_LABELS, p as PROPOSAL_STATUSES } from "./performance-Cj9pmeSi.mjs";
import { readLearningPolicy, t as ensurePerformanceSchema } from "./performance.server-kOlT5k3Z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/knowledge-proposals.server-C0stV1-L.js
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
function oneOf(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}
function asNullable(value) {
	if (value == null || value === "") return null;
	return String(value);
}
function parseRefs(raw) {
	let obj = null;
	if (raw && typeof raw === "object") obj = raw;
	else if (typeof raw === "string") try {
		obj = JSON.parse(raw);
	} catch {
		obj = null;
	}
	return {
		postPerformanceIds: Array.isArray(obj?.postPerformanceIds) ? obj.postPerformanceIds.map(String).filter(Boolean) : Array.isArray(obj?.post_performance_ids) ? obj.post_performance_ids.map(String).filter(Boolean) : [],
		assetIds: Array.isArray(obj?.assetIds) ? obj.assetIds.map(String).filter(Boolean) : Array.isArray(obj?.asset_ids) ? obj.asset_ids.map(String).filter(Boolean) : []
	};
}
function mapProposal(row) {
	return {
		id: String(row.id ?? ""),
		workspaceId: String(row.workspace_id ?? "default"),
		clientId: asNullable(row.client_id),
		status: oneOf(row.status, PROPOSAL_STATUSES, "PENDING_REVIEW"),
		suggestedScope: oneOf(row.suggested_scope, PROPOSAL_SCOPES, "VIDEO_GLOBAL"),
		source: oneOf(row.source, PROPOSAL_SOURCES, "POST_PERFORMANCE"),
		sourceRefs: parseRefs(row.source_refs),
		userInputDraft: String(row.user_input_draft ?? ""),
		learnedPrincipleDraft: String(row.learned_principle_draft ?? ""),
		principleHash: asNullable(row.principle_hash),
		confidence: row.confidence == null ? null : Number(row.confidence),
		createdAt: String(row.created_at ?? ""),
		reviewedBy: asNullable(row.reviewed_by),
		reviewedAt: asNullable(row.reviewed_at),
		decisionNote: asNullable(row.decision_note),
		mergedEntryId: asNullable(row.merged_entry_id),
		createdBy: asNullable(row.created_by)
	};
}
async function listKnowledgeProposals(filters) {
	await ensurePerformanceSchema();
	const limit = Math.min(Math.max(filters?.limit ?? 80, 1), 200);
	const admin = await getAgencyAdmin();
	if (admin) {
		let q = admin.from("knowledge_proposals").select("*").order("created_at", { ascending: false }).limit(limit);
		if (filters?.status) q = q.eq("status", filters.status);
		if (filters?.clientId) q = q.eq("client_id", filters.clientId);
		const { data, error } = await q;
		if (!error) return (data ?? []).map((row) => mapProposal(row));
		if (!isMissingTable(error)) return [];
	}
	try {
		const sql = await localSql();
		const clauses = [];
		const params = [];
		if (filters?.status) {
			params.push(filters.status);
			clauses.push(`status = $${params.length}`);
		}
		if (filters?.clientId) {
			params.push(filters.clientId);
			clauses.push(`client_id = $${params.length}`);
		}
		params.push(limit);
		const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
		return (await sql.query(`select * from knowledge_proposals ${where} order by created_at desc limit $${params.length}`, params)).map(mapProposal);
	} catch {
		return [];
	}
}
async function insertProposal(row) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("knowledge_proposals").insert(row).select("*").maybeSingle();
		if (!error && data) return mapProposal(data);
		if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await localSql()).query(`insert into knowledge_proposals
      (id, workspace_id, client_id, status, suggested_scope, source, source_refs,
       user_input_draft, learned_principle_draft, principle_hash, confidence,
       created_at, reviewed_by, reviewed_at, decision_note, merged_entry_id, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`, [
		row.id,
		row.workspace_id,
		row.client_id,
		row.status,
		row.suggested_scope,
		row.source,
		row.source_refs,
		row.user_input_draft,
		row.learned_principle_draft,
		row.principle_hash,
		row.confidence,
		row.created_at,
		row.reviewed_by,
		row.reviewed_at,
		row.decision_note,
		row.merged_entry_id,
		row.created_by
	]);
	return mapProposal(row);
}
function guessScope(input) {
	const caption = (input.caption ?? "").toLowerCase();
	if (input.hasThumb || /thumb|thumbnail/.test(caption)) return "THUMBNAIL_GLOBAL";
	if (/title|headline/.test(caption)) return "CLIENT_TITLES";
	if (input.platform === "YOUTUBE") return "CLIENT_IDEAS";
	return "CLIENT_CLIPPING";
}
async function maybeProposeFromWinner(snapshot, actorId) {
	if (snapshot.verdict !== "WINNER") return null;
	const policy = await readLearningPolicy();
	if (!policy.enabled) return null;
	return createProposalFromPerformance(snapshot, actorId, { autoMerge: policy.autoMerge });
}
async function createProposalFromPerformance(snapshot, actorId, opts) {
	await ensurePerformanceSchema();
	const { llmAvailable } = await import("./analyze.server-CGOV0UvB.mjs");
	if (opts?.heuristicOnly || !await llmAvailable() && !opts?.force) return createHeuristicProposal(snapshot, actorId, opts);
	let postCaption = null;
	try {
		const { readSocialPosts } = await import("./social-Cwlrz0WD.mjs");
		postCaption = (await readSocialPosts()).find((row) => row.id === snapshot.socialPostId)?.caption ?? null;
	} catch {
		postCaption = null;
	}
	const { loadKnowledgeDigest } = await import("./knowledge.server-BRKvcE8y.mjs");
	const [videoGlobal, clientClip] = await Promise.all([loadKnowledgeDigest("VIDEO_GLOBAL"), snapshot.clientId ? loadKnowledgeDigest("CLIENT_CLIPPING", snapshot.clientId) : Promise.resolve(null)]);
	let userInputDraft = heuristicUserInput(snapshot, postCaption);
	let learnedPrincipleDraft = heuristicPrinciple(snapshot, postCaption);
	let suggestedScope = guessScope({
		platform: snapshot.platform,
		caption: postCaption,
		hasThumb: false
	});
	let confidence = .55;
	try {
		const { xaiText } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
		const parsed = extractJson(await xaiText({
			messages: [
				{
					role: "system",
					content: "You distill a reusable content principle from a winning short-form post. Reply with compact JSON only: {\"userInputDraft\":\"...\",\"learnedPrincipleDraft\":\"one reusable principle\",\"suggestedScope\":\"CLIENT_TITLES|CLIENT_IDEAS|THUMBNAIL_GLOBAL|VIDEO_GLOBAL|CLIENT_CLIPPING\",\"confidence\":0.0-1.0}. Do not invent metrics. Do not include secrets or unrelated PII."
				},
				{
					role: "system",
					content: [videoGlobal, clientClip].filter(Boolean).join("\n\n") || "No prior knowledge."
				},
				{
					role: "user",
					content: JSON.stringify({
						platform: snapshot.platform,
						caption: postCaption?.slice(0, 400) ?? null,
						views: snapshot.metrics.views,
						likes: snapshot.metrics.likes,
						comments: snapshot.metrics.comments,
						shares: snapshot.metrics.shares,
						score: snapshot.score,
						verdict: snapshot.verdict
					})
				}
			],
			temperature: .2,
			maxTokens: 500,
			timeoutMs: 45e3
		}));
		if (parsed) {
			if (typeof parsed.userInputDraft === "string" && parsed.userInputDraft.trim()) userInputDraft = parsed.userInputDraft.trim().slice(0, 2e3);
			if (typeof parsed.learnedPrincipleDraft === "string" && parsed.learnedPrincipleDraft.trim()) learnedPrincipleDraft = parsed.learnedPrincipleDraft.trim().slice(0, 2e3);
			if (PROPOSAL_SCOPES.includes(parsed.suggestedScope)) suggestedScope = parsed.suggestedScope;
			if (typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1) confidence = parsed.confidence;
		}
	} catch {}
	const hash = principleHash(learnedPrincipleDraft);
	if (await recentDuplicate(hash)) return null;
	const stamp = nowIso();
	const proposal = await insertProposal({
		id: newId(),
		workspace_id: "default",
		client_id: snapshot.clientId,
		status: "PENDING_REVIEW",
		suggested_scope: suggestedScope,
		source: "POST_PERFORMANCE",
		source_refs: JSON.stringify({
			postPerformanceIds: [snapshot.id],
			assetIds: snapshot.mediaAssetId ? [snapshot.mediaAssetId] : []
		}),
		user_input_draft: userInputDraft,
		learned_principle_draft: learnedPrincipleDraft,
		principle_hash: hash,
		confidence,
		created_at: stamp,
		reviewed_by: null,
		reviewed_at: null,
		decision_note: null,
		merged_entry_id: null,
		created_by: actorId
	});
	await afterProposalCreated(proposal, snapshot, actorId);
	if (opts?.autoMerge) return decideProposal({
		id: proposal.id,
		decision: "APPROVED",
		actorId,
		note: "Auto-merged by learning.autoMerge"
	});
	return proposal;
}
async function createHeuristicProposal(snapshot, actorId, opts) {
	const draft = heuristicPrinciple(snapshot, null);
	const hash = principleHash(draft);
	if (await recentDuplicate(hash)) return null;
	const stamp = nowIso();
	const proposal = await insertProposal({
		id: newId(),
		workspace_id: "default",
		client_id: snapshot.clientId,
		status: "PENDING_REVIEW",
		suggested_scope: "CLIENT_CLIPPING",
		source: "POST_PERFORMANCE",
		source_refs: JSON.stringify({
			postPerformanceIds: [snapshot.id],
			assetIds: snapshot.mediaAssetId ? [snapshot.mediaAssetId] : []
		}),
		user_input_draft: heuristicUserInput(snapshot, null),
		learned_principle_draft: draft,
		principle_hash: hash,
		confidence: .4,
		created_at: stamp,
		reviewed_by: null,
		reviewed_at: null,
		decision_note: null,
		merged_entry_id: null,
		created_by: actorId
	});
	await afterProposalCreated(proposal, snapshot, actorId);
	if (opts?.autoMerge) return decideProposal({
		id: proposal.id,
		decision: "APPROVED",
		actorId,
		note: "Auto-merged by learning.autoMerge"
	});
	return proposal;
}
async function afterProposalCreated(proposal, snapshot, actorId) {
	try {
		const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
		await writeAuditEvent({
			actorUserId: actorId.startsWith("system:") ? null : actorId,
			actorType: actorId.startsWith("system:") ? "SYSTEM" : "USER",
			action: "knowledge.proposal.created",
			entityType: "knowledge_proposal",
			entityId: proposal.id,
			clientId: proposal.clientId,
			summary: "New learning proposal from winning post",
			metadata: {
				scope: proposal.suggestedScope,
				score: snapshot.score,
				platform: snapshot.platform
			}
		});
	} catch {}
	try {
		const { notifyAdmins } = await import("./notifications.server-CiVCMOdN.mjs");
		await notifyAdmins({
			category: "AGENT",
			severity: "INFO",
			title: "New learning proposal from a winning post",
			body: proposal.learnedPrincipleDraft.slice(0, 180),
			href: "/settings#ai-training",
			entityType: "knowledge_proposal",
			entityId: proposal.id
		});
	} catch {}
	import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.notifyLinearOfEntity({
		entityType: "KnowledgeProposal",
		entityId: proposal.id,
		proposal: true,
		title: `Review learning: ${proposal.learnedPrincipleDraft.slice(0, 80)}`,
		description: proposal.learnedPrincipleDraft,
		labels: ["learning"],
		actorId
	})).catch(() => {});
}
async function distillWinnersToProposals(actorId, limit = 3) {
	const policy = await readLearningPolicy();
	if (!policy.enabled) return 0;
	const { listWinners } = await import("./performance.server-kOlT5k3Z.mjs");
	const winners = await listWinners({ limit: 40 });
	if (!winners.length) return 0;
	const existing = await listKnowledgeProposals({ limit: 80 });
	const seenPosts = new Set(existing.flatMap((row) => row.sourceRefs.postPerformanceIds));
	const seenAssets = new Set(existing.flatMap((row) => row.sourceRefs.assetIds));
	let created = 0;
	for (const winner of winners) {
		if (created >= limit) break;
		if (seenPosts.has(winner.id)) continue;
		if (winner.mediaAssetId && seenAssets.has(winner.mediaAssetId)) continue;
		if (await createProposalFromPerformance(winner, actorId, {
			autoMerge: policy.autoMerge,
			heuristicOnly: true
		})) {
			created += 1;
			seenPosts.add(winner.id);
			if (winner.mediaAssetId) seenAssets.add(winner.mediaAssetId);
		}
	}
	return created;
}
function heuristicUserInput(snapshot, caption) {
	const views = snapshot.metrics.views != null ? `${snapshot.metrics.views} views` : "unknown views";
	const cap = caption ? ` Caption: “${caption.slice(0, 180)}”.` : "";
	return `This hook worked on ${snapshot.platform}: ${views}, score ${snapshot.score ?? "n/a"}.${cap}`;
}
function heuristicPrinciple(snapshot, caption) {
	const platform = snapshot.platform.toLowerCase();
	const hook = caption ? caption.split(/[\n.!?]/)[0]?.slice(0, 80) : null;
	if (hook) return `On ${platform}, hooks like “${hook}” correlated with above-peer engagement. Reuse the pattern, not the exact line.`;
	return `Winning ${platform} posts in this set over-indexed on early hook + native caption style. Repeat the structure on similar clips.`;
}
function extractJson(text) {
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) return null;
	try {
		const parsed = JSON.parse(match[0]);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
async function recentDuplicate(hash) {
	const rows = await listKnowledgeProposals({ limit: 80 });
	const cutoff = Date.now() - 2592e6;
	return rows.some((row) => row.principleHash === hash && Date.parse(row.createdAt) >= cutoff && (row.status === "PENDING_REVIEW" || row.status === "APPROVED" || row.status === "MERGED"));
}
async function decideProposal(input) {
	const existing = (await listKnowledgeProposals({ limit: 200 })).find((row) => row.id === input.id);
	if (!existing) throw new Error("PROPOSAL_MISSING");
	if (existing.status !== "PENDING_REVIEW") throw new Error("PROPOSAL_NOT_PENDING");
	const stamp = nowIso();
	if (input.decision === "REJECTED") {
		await patchProposal(input.id, {
			status: "REJECTED",
			reviewed_by: input.actorId,
			reviewed_at: stamp,
			decision_note: input.note ?? null
		});
		await auditDecision(input, existing, "REJECTED", null);
		return {
			...existing,
			status: "REJECTED",
			reviewedBy: input.actorId,
			reviewedAt: stamp,
			decisionNote: input.note ?? null
		};
	}
	const scope = existing.suggestedScope;
	const needsClient = scope === "CLIENT_TITLES" || scope === "CLIENT_IDEAS" || scope === "CLIENT_CLIPPING";
	if (needsClient && !existing.clientId) throw new Error("CLIENT_REQUIRED");
	const entryId = newId();
	const { getAgencyAdmin: adminFn, localSql: sqlFn } = await import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
	const admin = await adminFn();
	const entry = {
		id: entryId,
		scope,
		client_id: needsClient ? existing.clientId : null,
		user_input: existing.userInputDraft,
		learned_principle: existing.learnedPrincipleDraft,
		status: "ACTIVE",
		tags: null,
		timestamp: stamp,
		created_at: stamp,
		updated_at: stamp,
		created_by: input.actorId,
		deleted_at: null
	};
	if (admin) {
		const { error } = await admin.from("knowledge_entries").insert(entry);
		if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	if (!admin) await (await sqlFn()).query(`insert into knowledge_entries
        (id, scope, client_id, user_input, learned_principle, status, tags, timestamp,
         created_at, updated_at, created_by, deleted_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11)`, [
		entry.id,
		entry.scope,
		entry.client_id,
		entry.user_input,
		entry.learned_principle,
		entry.status,
		entry.tags,
		entry.timestamp,
		entry.created_at,
		entry.created_by,
		entry.deleted_at
	]);
	await patchProposal(input.id, {
		status: "MERGED",
		reviewed_by: input.actorId,
		reviewed_at: stamp,
		decision_note: input.note ?? null,
		merged_entry_id: entryId
	});
	await auditDecision(input, existing, "MERGED", entryId);
	return {
		...existing,
		status: "MERGED",
		reviewedBy: input.actorId,
		reviewedAt: stamp,
		decisionNote: input.note ?? null,
		mergedEntryId: entryId
	};
}
async function patchProposal(id, patch) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("knowledge_proposals").update(patch).eq("id", id);
		if (!error) return;
		if (!isMissingTable(error)) return;
	}
	const sql = await localSql();
	const keys = Object.keys(patch);
	const sets = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
	await sql.query(`update knowledge_proposals set ${sets} where id = $1`, [id, ...keys.map((key) => patch[key])]);
}
async function auditDecision(input, existing, status, mergedId) {
	try {
		const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
		await writeAuditEvent({
			actorUserId: input.actorId,
			actorType: "USER",
			action: status === "MERGED" ? "knowledge.proposal.approved" : "knowledge.proposal.rejected",
			entityType: "knowledge_proposal",
			entityId: input.id,
			clientId: existing.clientId,
			summary: status === "MERGED" ? `Approved learning proposal → ${SCOPE_LABELS[existing.suggestedScope]}` : "Rejected learning proposal",
			metadata: {
				scope: existing.suggestedScope,
				mergedEntryId: mergedId,
				note: input.note ?? null
			}
		});
	} catch {}
}
//#endregion
export { createProposalFromPerformance, decideProposal, distillWinnersToProposals, listKnowledgeProposals, maybeProposeFromWinner };
