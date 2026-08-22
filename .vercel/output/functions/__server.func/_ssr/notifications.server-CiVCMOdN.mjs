import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { d as NOTIFICATION_CATEGORIES, p as NOTIFICATION_SEVERITIES } from "./safety-CI611PZC.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { n as listActiveOperatorIds, t as ensureSafetySchema } from "./safety-schema.server-pGsE9nul.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications.server-CiVCMOdN.js
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
function oneOf(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}
function mapNotification(row) {
	return {
		id: String(row.id ?? ""),
		workspaceId: String(row.workspace_id ?? "default"),
		userId: String(row.user_id ?? ""),
		category: oneOf(row.category, NOTIFICATION_CATEGORIES, "SYSTEM"),
		severity: oneOf(row.severity, NOTIFICATION_SEVERITIES, "INFO"),
		title: String(row.title ?? ""),
		body: String(row.body ?? ""),
		href: row.href == null ? null : String(row.href),
		entityType: row.entity_type == null ? null : String(row.entity_type),
		entityId: row.entity_id == null ? null : String(row.entity_id),
		readAt: row.read_at == null ? null : String(row.read_at),
		createdAt: String(row.created_at ?? "")
	};
}
async function readPrefs(userId) {
	try {
		await ensureSafetySchema();
	} catch {}
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();
		if (!error && data) {
			const rec = data;
			let muted = [];
			try {
				const parsed = JSON.parse(String(rec.muted_categories ?? "[]"));
				if (Array.isArray(parsed)) muted = parsed.filter((item) => NOTIFICATION_CATEGORIES.includes(item));
			} catch {
				muted = [];
			}
			return {
				userId,
				mutedCategories: muted,
				emailEnabled: rec.email_enabled === "1" || rec.email_enabled === true
			};
		}
	}
	try {
		const rows = await (await localSql()).query("select muted_categories, email_enabled from notification_preferences where user_id = $1", [userId]);
		if (rows[0]) {
			let muted = [];
			try {
				const parsed = JSON.parse(rows[0].muted_categories);
				if (Array.isArray(parsed)) muted = parsed.filter((item) => NOTIFICATION_CATEGORIES.includes(item));
			} catch {
				muted = [];
			}
			return {
				userId,
				mutedCategories: muted,
				emailEnabled: rows[0].email_enabled === "1"
			};
		}
	} catch {}
	return {
		userId,
		mutedCategories: [],
		emailEnabled: false
	};
}
async function writeNotificationPrefs(input) {
	await ensureSafetySchema();
	const stamp = nowIso();
	const muted = JSON.stringify(input.mutedCategories);
	const email = input.emailEnabled ? "1" : "0";
	const payload = {
		user_id: input.userId,
		muted_categories: muted,
		email_enabled: email,
		updated_at: stamp
	};
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("notification_preferences").upsert(payload, { onConflict: "user_id" });
	try {
		await (await localSql()).query(`insert into notification_preferences (user_id, muted_categories, email_enabled, updated_at)
       values ($1,$2,$3,$4)
       on conflict (user_id) do update set muted_categories = excluded.muted_categories, email_enabled = excluded.email_enabled, updated_at = excluded.updated_at`, [
			input.userId,
			muted,
			email,
			stamp
		]);
	} catch {}
	return {
		userId: input.userId,
		mutedCategories: input.mutedCategories,
		emailEnabled: input.emailEnabled
	};
}
async function insertNotification(row) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("notifications").insert(row);
		if (!error) return;
		if (!isMissingTable(error)) return;
	}
	await (await localSql()).query(`insert into notifications
      (id, workspace_id, user_id, category, severity, title, body, href, entity_type, entity_id, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
		row.id,
		row.workspace_id,
		row.user_id,
		row.category,
		row.severity,
		row.title,
		row.body,
		row.href,
		row.entity_type,
		row.entity_id,
		row.created_at
	]);
}
async function deliverExternal(input) {
	const webhook = (await readAppSetting("OPS_DISCORD_WEBHOOK"))?.trim() ?? "";
	if (webhook.startsWith("https://")) try {
		await fetch(webhook, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: `**${input.title}**\n${input.body}${input.href ? `\n${input.href}` : ""}`.slice(0, 1800) }),
			signal: AbortSignal.timeout(8e3)
		});
	} catch {}
	const emailOn = (await readAppSetting("OPS_EMAIL_ENABLED"))?.trim() === "true";
	const emailHook = (await readAppSetting("OPS_EMAIL_WEBHOOK"))?.trim() ?? "";
	if (emailOn && emailHook.startsWith("https://") && (input.severity === "CRITICAL" || input.severity === "WARNING")) try {
		await fetch(emailHook, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: input.title,
				body: input.body,
				href: input.href,
				severity: input.severity
			}),
			signal: AbortSignal.timeout(8e3)
		});
	} catch {}
}
async function notifyUsers(input) {
	try {
		await ensureSafetySchema();
	} catch {}
	const stamp = nowIso();
	const ids = [...new Set(input.userIds.filter(Boolean))];
	for (const userId of ids) {
		const prefs = await readPrefs(userId);
		if (input.severity !== "CRITICAL" && !input.forceCritical && prefs.mutedCategories.includes(input.category)) continue;
		try {
			await insertNotification({
				id: newId(),
				workspace_id: "default",
				user_id: userId,
				category: input.category,
				severity: input.severity,
				title: input.title.slice(0, 160),
				body: input.body.slice(0, 600),
				href: input.href ?? null,
				entity_type: input.entityType ?? null,
				entity_id: input.entityId ?? null,
				created_at: stamp
			});
		} catch {}
	}
	if (input.severity === "CRITICAL" || input.severity === "WARNING") deliverExternal({
		severity: input.severity,
		title: input.title,
		body: input.body,
		href: input.href ?? null
	});
}
async function notifyAdmins(input) {
	const admins = await listActiveOperatorIds({ adminsOnly: true });
	const extras = input.extraUserIds ?? [];
	const userIds = admins.length > 0 ? [...admins, ...extras] : extras;
	if (userIds.length === 0) return;
	await notifyUsers({
		...input,
		userIds
	});
}
async function listNotifications(userId, opts) {
	try {
		await ensureSafetySchema();
	} catch {}
	const limit = Math.min(Math.max(opts?.limit ?? 40, 1), 100);
	const admin = await getAgencyAdmin();
	if (admin) {
		let q = admin.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
		if (opts?.unreadOnly) q = q.is("read_at", null);
		const { data, error } = await q;
		if (!error) return (data ?? []).map((row) => mapNotification(row));
		if (!isMissingTable(error)) return [];
	}
	try {
		return (await (await localSql()).query(opts?.unreadOnly ? "select * from notifications where user_id = $1 and read_at is null order by created_at desc limit $2" : "select * from notifications where user_id = $1 order by created_at desc limit $2", [userId, limit])).map(mapNotification);
	} catch {
		return [];
	}
}
async function markNotificationsRead(input) {
	await ensureSafetySchema();
	const stamp = nowIso();
	const admin = await getAgencyAdmin();
	if (admin) {
		let q = admin.from("notifications").update({ read_at: stamp }).eq("user_id", input.userId).is("read_at", null);
		if (!input.all && input.ids && input.ids.length > 0) q = q.in("id", input.ids);
		const { error } = await q;
		if (error && !isMissingTable(error)) {}
	}
	try {
		const sql = await localSql();
		if (input.all) return (await sql.query("update notifications set read_at = $2 where user_id = $1 and read_at is null returning id", [input.userId, stamp])).length;
		const ids = input.ids ?? [];
		if (ids.length === 0) return 0;
		return (await sql.query("update notifications set read_at = $3 where user_id = $1 and id = any($2::text[]) and read_at is null returning id", [
			input.userId,
			ids,
			stamp
		])).length;
	} catch {
		return 0;
	}
}
async function unreadCount(userId) {
	return (await listNotifications(userId, {
		unreadOnly: true,
		limit: 80
	})).length;
}
//#endregion
export { listNotifications, markNotificationsRead, notifyAdmins, notifyUsers, readPrefs as readNotificationPrefs, unreadCount, writeNotificationPrefs };
