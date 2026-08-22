import { d as __exportAll } from "./ssr.mjs";
import { a as parsePlaybookPolicies, t as DEFAULT_PLAYBOOK_POLICIES } from "./playbooks-BbqI43Jw.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/autonomy-policy.server-HcFlL3K7.js
var autonomy_policy_server_exports = /* @__PURE__ */ __exportAll({
	AGENT_MUTATIONS: () => AGENT_MUTATIONS,
	readAutomationEnabled: () => readAutomationEnabled,
	readPlaybookPolicies: () => readPlaybookPolicies,
	writeAutomationEnabled: () => writeAutomationEnabled,
	writePlaybookPolicies: () => writePlaybookPolicies
});
async function readAutomationEnabled() {
	const raw = (await readAppSetting("AUTOMATION_ENABLED"))?.trim();
	if (!raw) return true;
	return raw !== "false" && raw !== "0" && raw.toLowerCase() !== "off";
}
async function writeAutomationEnabled(enabled) {
	await writeAppSetting("AUTOMATION_ENABLED", enabled ? "true" : "false");
}
async function readPlaybookPolicies() {
	const raw = await readAppSetting("AUTOMATION_POLICIES_JSON");
	if (!raw) return { ...DEFAULT_PLAYBOOK_POLICIES };
	try {
		return parsePlaybookPolicies(JSON.parse(raw));
	} catch {
		return { ...DEFAULT_PLAYBOOK_POLICIES };
	}
}
async function writePlaybookPolicies(policies) {
	await writeAppSetting("AUTOMATION_POLICIES_JSON", JSON.stringify(policies));
}
var AGENT_MUTATIONS = /* @__PURE__ */ new Set([
	"create_client",
	"update_client",
	"mark_payment_paid",
	"set_client_stage",
	"create_lead",
	"update_lead",
	"update_lead_status",
	"pull_client_analytics",
	"pull_analytics",
	"regenerate_suggested_titles",
	"regenerate_suggested_ideas",
	"social.start_machine",
	"social.stop_machine",
	"social.set_auto_stop",
	"social.ensure_computer_use",
	"social.take_screenshot",
	"social.mark_platform_session",
	"social.open_platform",
	"social.check_session_health",
	"social.create_upload_job",
	"social.retry_upload_job",
	"social.cancel_upload_job",
	"social.bulk_create_upload_jobs",
	"social.force_stop_if_running",
	"approvals.decide",
	"library.ingest_url",
	"library.ingest_stream_clip",
	"library.ingest_thumbnail",
	"library.queue_render",
	"library.attach_to_social_job",
	"skills.invoke",
	"skills.create",
	"skills.patch",
	"skills.set_enabled",
	"skill_manage.create",
	"skill_manage.edit",
	"skill_manage.patch",
	"skill_manage.write_file",
	"skill_manage.set_enabled",
	"skill_manage.set_provenance_review",
	"skill_manage.rollback",
	"computer.start",
	"computer.stop",
	"computer.screenshot",
	"computer.mouse_click",
	"computer.mouse_move",
	"computer.mouse_drag",
	"computer.mouse_scroll",
	"computer.keyboard_type",
	"computer.keyboard_key",
	"browser.open_url",
	"browser.upload_file",
	"clipping.generate_ideas",
	"clipping.generate_titles",
	"clipping.generate_thumbnail",
	"clipping.set_stage",
	"clipping.mark_published",
	"clipping.distribute_social",
	"clipping.run_skill",
	"clipping.propose_skill",
	"knowledge.decide_proposal",
	"linear.create_issue",
	"linear.update_issue"
]);
//#endregion
export { readPlaybookPolicies as i, autonomy_policy_server_exports as n, readAutomationEnabled as r, AGENT_MUTATIONS as t };
