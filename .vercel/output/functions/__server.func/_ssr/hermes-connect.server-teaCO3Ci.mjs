import { i as formatPlaybookPackage } from "./playbooks-BbqI43Jw.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { i as readPlaybookPolicies, r as readAutomationEnabled } from "./autonomy-policy.server-HcFlL3K7.mjs";
import { a as listApiKeyRows } from "./autonomy-auth.server-ayVAPOsv.mjs";
import { a as readOutboundConfig, i as readLastDeliveryByEvent, r as readLastDelivery } from "./autonomy-events.server-DCl-_J_B.mjs";
import { i as PLAYBOOK_PACKAGE_VERSION, o as deriveConnectSteps, s as deriveHermesConnection } from "./connect-Vop9T4X0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hermes-connect.server-teaCO3Ci.js
var CONNECT_KEY = "HERMES_CONNECT_JSON";
var EMPTY_FLAGS = {
	pastedIntoHermes: false,
	pastedAt: null,
	socialPolicyAckedAt: null,
	outboundSkipped: false
};
async function readConnectFlags() {
	const raw = await readAppSetting(CONNECT_KEY);
	if (!raw) return { ...EMPTY_FLAGS };
	try {
		const parsed = JSON.parse(raw);
		return {
			pastedIntoHermes: parsed.pastedIntoHermes === true,
			pastedAt: typeof parsed.pastedAt === "string" ? parsed.pastedAt : null,
			socialPolicyAckedAt: typeof parsed.socialPolicyAckedAt === "string" ? parsed.socialPolicyAckedAt : null,
			outboundSkipped: parsed.outboundSkipped === true
		};
	} catch {
		return { ...EMPTY_FLAGS };
	}
}
async function writeConnectFlags(patch) {
	const next = {
		...await readConnectFlags(),
		...patch
	};
	await writeAppSetting(CONNECT_KEY, JSON.stringify(next));
	return next;
}
function saneWhen(value) {
	if (!value?.trim()) return null;
	const time = new Date(value).getTime();
	if (!Number.isFinite(time)) return null;
	if (time < Date.parse("2020-01-01T00:00:00.000Z") || time > Date.now() + 12e4) return null;
	return value;
}
async function buildConnectStatus() {
	const [keys, flags, outbound, lastDelivery, byEvent, enabled, policies, mcpHash, webhookSecret, daytona] = await Promise.all([
		listApiKeyRows(),
		readConnectFlags(),
		readOutboundConfig(),
		readLastDelivery(),
		readLastDeliveryByEvent(),
		readAutomationEnabled(),
		readPlaybookPolicies(),
		readAppSetting("MCP_TOKEN_HASH"),
		readAppSetting("WEBHOOK_SIGNING_SECRET"),
		readAppSetting("DAYTONA_API_KEY")
	]);
	const active = keys.filter((row) => !row.revokedAt);
	const hermesKey = active.find((row) => row.name.toLowerCase().includes("hermes")) ?? active[0] ?? null;
	const keyLastUsedAt = active.map((row) => saneWhen(row.lastUsedAt)).filter((value) => Boolean(value)).sort().at(-1) ?? null;
	const hasHermesKey = active.length > 0;
	const hermesConnection = deriveHermesConnection({
		hasHermesKey,
		keyLastUsedAt
	});
	const socialPolicyAcked = Boolean(flags.socialPolicyAckedAt);
	const outboundUrlConfigured = Boolean(outbound.destinationUrl);
	const steps = deriveConnectSteps({
		hasHermesKey,
		keyLastUsedAt,
		pastedIntoHermes: flags.pastedIntoHermes,
		socialPolicyAcked,
		outboundUrlConfigured,
		outboundSkipped: flags.outboundSkipped
	});
	let socialMachineState = "not_configured";
	try {
		const { peekSocialHealth } = await import("./social-Cwlrz0WD.mjs");
		socialMachineState = (await peekSocialHealth()).state;
	} catch {
		socialMachineState = daytona?.trim() ? "stopped" : "not_configured";
	}
	return {
		hasHermesKey,
		keyLastUsedAt,
		keyLast4: hermesKey?.last4 ?? null,
		keyName: hermesKey?.name ?? null,
		hermesConnection,
		playbookPackageVersion: PLAYBOOK_PACKAGE_VERSION,
		pastedIntoHermes: flags.pastedIntoHermes,
		pastedAt: flags.pastedAt,
		socialPolicyAcked,
		outboundSkipped: flags.outboundSkipped,
		policies,
		webhookSubscriptions: outbound.events,
		outboundUrlConfigured,
		lastDelivery: {
			at: saneWhen(lastDelivery.at),
			status: lastDelivery.status,
			eventType: lastDelivery.eventType
		},
		lastDeliveryByEvent: byEvent,
		daytonaConnected: Boolean(daytona?.trim()),
		socialMachineState,
		automationEnabled: enabled,
		mcpConfigured: Boolean(mcpHash),
		webhookConfigured: Boolean(webhookSecret),
		steps,
		completedRequired: Number(steps.mintKey) + Number(steps.pastePlaybook) + Number(steps.socialPolicy),
		requiredTotal: 3
	};
}
function connectionFromStatus(status) {
	return status.hermesConnection;
}
async function buildPlaybookPackageText(origin) {
	const [policies, enabled, skills, llm] = await Promise.all([
		readPlaybookPolicies(),
		readAutomationEnabled(),
		import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r).then((mod) => mod.listPublicSkills()).catch(() => []),
		import("./llm-router.server-TNnMY3uU.mjs").then((n) => n.t).then((mod) => mod.readLlmRouter()).catch(() => null)
	]);
	return {
		version: PLAYBOOK_PACKAGE_VERSION,
		text: formatPlaybookPackage({
			policies,
			enabled,
			origin,
			version: PLAYBOOK_PACKAGE_VERSION,
			skills: skills.map((row) => ({
				slug: row.slug,
				name: row.name,
				version: row.version
			})),
			llmProvider: llm?.defaultProvider,
			llmModel: llm?.defaultModel
		})
	};
}
//#endregion
export { buildConnectStatus, buildPlaybookPackageText, connectionFromStatus, readConnectFlags, writeConnectFlags };
