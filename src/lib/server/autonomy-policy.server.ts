import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import {
  DEFAULT_PLAYBOOK_POLICIES,
  parsePlaybookPolicies,
  type PlaybookPolicies,
} from "@/lib/playbooks";

export async function readAutomationEnabled(): Promise<boolean> {
  const raw = (await readAppSetting("AUTOMATION_ENABLED"))?.trim();
  if (!raw) return true;
  return raw !== "false" && raw !== "0" && raw.toLowerCase() !== "off";
}

export async function writeAutomationEnabled(enabled: boolean): Promise<void> {
  await writeAppSetting("AUTOMATION_ENABLED", enabled ? "true" : "false");
}

export async function readPlaybookPolicies(): Promise<PlaybookPolicies> {
  const raw = await readAppSetting("AUTOMATION_POLICIES_JSON");
  if (!raw) return { ...DEFAULT_PLAYBOOK_POLICIES };
  try {
    return parsePlaybookPolicies(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PLAYBOOK_POLICIES };
  }
}

export async function writePlaybookPolicies(policies: PlaybookPolicies): Promise<void> {
  await writeAppSetting("AUTOMATION_POLICIES_JSON", JSON.stringify(policies));
}

export const AGENT_MUTATIONS = new Set([
  "create_client",
  "update_client",
  "mark_payment_paid",
  "set_client_stage",
  "create_lead",
  "update_lead",
  "update_lead_status",
  "pull_client_analytics",
  "pull_analytics",
  "analytics.refresh_post_performance",
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
  "stream.create_clip",
  "stream.update_clip",
  "bridge.apply_mount",
  "bridge.ingest_drop",
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
  "computer.move",
  "computer.mouse_drag",
  "computer.drag",
  "computer.mouse_scroll",
  "computer.scroll",
  "computer.keyboard_type",
  "computer.keyboard.type",
  "computer.keyboard_key",
  "computer.key",
  "computer.hotkey",
  "browser.open_url",
  "browser.upload_file",
  "browser.open_instagram_upload",
  "browser.open_x_compose",
  "browser.open_tiktok_upload",
  "clipping.generate_ideas",
  "clipping.generate_titles",
  "clipping.generate_thumbnail",
  "clipping.set_stage",
  "clipping.mark_published",
  "clipping.distribute_social",
  "clipping.run_skill",
  "clipping.propose_skill",
  "clipping.run_browser_procedure",
  "clipping.check_crayo_login",
  "clipping.observe_desktop",
  "knowledge.decide_proposal",
  "linear.create_issue",
  "linear.update_issue",
  "grokbot.claim_work",
  "grokbot.complete_work",
  "health.retry_job",
  "agent.start_run",
]);
