import { n as createContextClient, t as createAdminClient } from "../_libs/@supabase/server+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clients.server-54cTCuV1.js
/** Public Supabase project config. Safe to ship to the browser. */
var SUPABASE_URL = "https://xpfoidcvbwmpbwodjvqb.supabase.co";
var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TygDEM3S66tJtHLKaTqcCg_uSEvRvyu";
var SUPABASE_JWKS_URL = "https://xpfoidcvbwmpbwodjvqb.supabase.co/auth/v1/.well-known/jwks.json";
var SUPABASE_PROJECT_REF = "xpfoidcvbwmpbwodjvqb";
var AGENCY_TABLES = [
	"clients",
	"payments",
	"team_members",
	"client_progress",
	"analytics_snapshots",
	"ideation_threads",
	"ideation_messages",
	"thumbnail_sessions",
	"thumbnail_messages",
	"knowledge_entries",
	"leads",
	"app_settings",
	"app_profiles",
	"api_keys",
	"agent_audit_log",
	"webhook_deliveries",
	"agent_jobs",
	"agent_idempotency",
	"social_posts",
	"skills",
	"skill_runs",
	"workspace_subscriptions",
	"billing_invoices",
	"approval_requests",
	"notifications",
	"audit_events",
	"notification_preferences",
	"client_portal_users",
	"client_portal_sessions",
	"post_performance",
	"asset_performance_rollups",
	"knowledge_proposals",
	"performance_fetch_queue"
];
/** Server-only secret resolution. Never import from client modules. */
function looksRedacted(value) {
	return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}
/**
* Project secret API key. Prefer process env (published host). The fallback
* exists so this preview can talk to the agency's Supabase project without a
* `.env` file — it must never be imported into a client bundle.
*/
var PREVIEW_SECRET = "sb_secret_Zrc_b_jnhlijVtVestVABA_VDV1AE_M";
function getSupabaseSecret() {
	if (typeof process === "undefined") return void 0;
	const fromEnv = process.env.SUPABASE_SECRET_KEY?.trim();
	if (fromEnv && !looksRedacted(fromEnv)) return fromEnv;
	const plural = process.env.SUPABASE_SECRET_KEYS?.trim();
	if (plural) try {
		const parsed = JSON.parse(plural);
		const value = typeof parsed?.default === "string" ? parsed.default.trim() : "";
		if (value && !looksRedacted(value)) return value;
	} catch {}
	if (!looksRedacted(PREVIEW_SECRET)) return PREVIEW_SECRET;
}
function hasSupabaseSecret() {
	return Boolean(getSupabaseSecret());
}
function getSupabaseEnvOverrides() {
	const secret = getSupabaseSecret();
	return {
		url: SUPABASE_URL,
		publishableKeys: { default: SUPABASE_PUBLISHABLE_KEY },
		jwks: new URL(SUPABASE_JWKS_URL),
		...secret ? { secretKeys: { default: secret } } : {}
	};
}
/** RLS-scoped client (anon / user JWT). Use for health probes, not financial writes. */
function createPublishableClient() {
	return createContextClient({ env: getSupabaseEnvOverrides() });
}
/** Bypasses RLS. Null when the secret key is not configured on the server. */
function tryCreateAdminClient() {
	if (!hasSupabaseSecret()) return null;
	try {
		return createAdminClient({ env: getSupabaseEnvOverrides() });
	} catch {
		return null;
	}
}
//#endregion
export { SUPABASE_URL as a, createPublishableClient, hasSupabaseSecret, SUPABASE_PUBLISHABLE_KEY as i, SUPABASE_JWKS_URL as n, SUPABASE_PROJECT_REF as r, AGENCY_TABLES as t, tryCreateAdminClient };
