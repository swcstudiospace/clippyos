import { t as schema_default } from "./schema-GKqshK6g.mjs";
import { a as SUPABASE_URL, createPublishableClient, hasSupabaseSecret, i as SUPABASE_PUBLISHABLE_KEY, n as SUPABASE_JWKS_URL, r as SUPABASE_PROJECT_REF, t as AGENCY_TABLES, tryCreateAdminClient } from "./clients.server-54cTCuV1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/probe.server-BYbF5cZ9.js
async function ping(url, headers) {
	try {
		return (await fetch(url, {
			headers,
			signal: AbortSignal.timeout(4e3)
		})).ok;
	} catch {
		return false;
	}
}
async function probeOneTable(client, name) {
	try {
		const { error } = await client.from(name).select("*").limit(0);
		return {
			name,
			exists: !error
		};
	} catch {
		return {
			name,
			exists: false
		};
	}
}
async function probeTables() {
	const client = tryCreateAdminClient() ?? createPublishableClient();
	const chunkSize = 4;
	const results = [];
	for (let i = 0; i < AGENCY_TABLES.length; i += chunkSize) {
		const chunk = AGENCY_TABLES.slice(i, i + chunkSize);
		const probed = await Promise.all(chunk.map((name) => probeOneTable(client, name)));
		results.push(...probed);
	}
	return results;
}
async function ensureOperatorProfile(userId) {
	const { getUserRole } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	return getUserRole(userId);
}
async function probeSupabase(userId) {
	const [authHealth, jwksHealth, tables] = await Promise.all([
		ping(`${SUPABASE_URL}/auth/v1/health`, { apikey: SUPABASE_PUBLISHABLE_KEY }),
		ping(SUPABASE_JWKS_URL),
		probeTables()
	]);
	const operatorRole = await ensureOperatorProfile(userId);
	return {
		url: SUPABASE_URL,
		projectRef: SUPABASE_PROJECT_REF,
		authHealth,
		jwksHealth,
		adminConfigured: hasSupabaseSecret(),
		tables,
		schemaReady: tables.every((table) => table.exists),
		operatorRole,
		schemaSql: schema_default
	};
}
//#endregion
export { probeSupabase };
