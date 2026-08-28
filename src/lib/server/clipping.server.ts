/**
 * Clipping tab backend — cockpit APIs around the existing Social Machine VM
 *
 * Pure composition over the audited modules: daytona.server.ts owns the VM,
 * social-ops.server.ts owns operator actions and their audit trail,
 * storage-bridge.server.ts owns machine-drop listing/ingest, crayo.server.ts
 * owns credential state. No business logic lives here.
 */
import {
  getRunningSocialSandbox,
  getSocialMachineStatus,
  loadDaytonaConfig,
  machineOpenUrlCommand,
} from "@/lib/server/daytona.server";
import { browserGetPageSummary } from "@/lib/server/browser-use.server";
import { writeAppSetting, readAppSetting } from "@/lib/server/app-settings.server";
import {
  executeBrowserProcedure,
  type ExecuteBrowserProcedureResult,
} from "@/lib/server/browser-procedure.server";
import { getSkillById, listPublicSkills } from "@/lib/server/skills.server";
import { classifyCrayoPage, parseBrowserProcedureFromScripts } from "@/lib/clipping";
import { handleSocialAction } from "@/lib/server/social-ops.server";
import {
  ingestMachineDrop,
  listMachineDrops,
  type MachineDrop,
} from "@/lib/server/storage-bridge.server";
import { crayoAvailable } from "@/lib/server/crayo.server";
import {
  isWindowsSnapshot,
  type SocialMachineOs,
} from "@/lib/social-machine";
import type { SocialMachineStatus } from "@/lib/social";

const DEFAULT_CRAYO_URL = "https://crayo.io";
/** Last known crayo.io session state, persisted for the cockpit + v1 surface. */
export const CRAYO_LOGIN_STATE_KEY = "clipping.crayo_login_state";
export const CRAYO_LOGIN_CHECKED_AT_KEY = "clipping.crayo_login_checked_at";
export type CrayoLoginStatus = { state: "unknown" | "logged_in" | "login_wall"; checkedAt: string | null };

async function readCrayoLoginStatus(): Promise<CrayoLoginStatus> {
  const [state, checkedAt] = await Promise.all([
    readAppSetting(CRAYO_LOGIN_STATE_KEY),
    readAppSetting(CRAYO_LOGIN_CHECKED_AT_KEY),
  ]);
  const parsed = state === "logged_in" || state === "login_wall" ? state : "unknown";
  return { state: parsed, checkedAt: checkedAt?.trim() || null };
}

export type ClippingSnapshot = {
  machine: SocialMachineStatus;
  crayoReady: boolean;
  crayoLogin: CrayoLoginStatus;
  proxyConfigured: boolean;
  desktopPreviewUrl: string | null;
  drops: MachineDrop[];
};

async function assembleSnapshot(): Promise<ClippingSnapshot> {
  const [machine, crayoReady, config, drops] = await Promise.all([
    getSocialMachineStatus(),
    crayoAvailable(),
    loadDaytonaConfig(),
    listMachineDrops(),
  ]);
  const crayoLogin = await readCrayoLoginStatus();
  return {
    machine,
    crayoReady,
    crayoLogin,
    proxyConfigured: config?.proxyUrl != null,
    // Same availability rule as socialGetDesktopPreview (social.get_desktop_preview).
    desktopPreviewUrl:
      machine.state === "running" && Boolean(machine.previewUrl) ? machine.previewUrl : null,
    drops,
  };
}

/**
 * Open an arbitrary URL in the machine browser via the same command path
 * social.open_platform uses (openPlatformInMachine -> executeCommand with the
 * proxy-pinned machineOpenUrlCommand), reusing the daytona running-sandbox
 * helper instead of copying its status/config/client chain. Throws
 * MACHINE_STOPPED and DAYTONA_UNAVAILABLE verbatim when the machine is not
 * usable — this never starts a stopped VM.
 */
async function openUrlInMachine(url: string): Promise<void> {
  const { sandbox } = await getRunningSocialSandbox();
  // resolveOs's sandbox branch: windows snapshot -> windows, otherwise linux.
  const os: SocialMachineOs = isWindowsSnapshot(sandbox.snapshot) ? "windows" : "linux";
  await sandbox.process.executeCommand(await machineOpenUrlCommand(os, url), undefined, undefined, 20);
}

export async function startClippingSession(
  actorId: string,
  openUrl?: string,
): Promise<ClippingSnapshot> {
  // Audited operator path: social.start_machine{waitUntilReady:true} — runs
  // startSocialMachine(), polls until running/error, appends the audit event.
  await handleSocialAction("social.start_machine", { waitUntilReady: true }, actorId);
  try {
    await openUrlInMachine(openUrl ?? DEFAULT_CRAYO_URL);
  } catch {
    /* best-effort: MACHINE_STOPPED / DAYTONA_UNAVAILABLE surface via the snapshot */
  }
  return assembleSnapshot();
}

export async function stopClippingSession(actorId: string): Promise<ClippingSnapshot> {
  // Audited operator path: social.stop_machine — runs stopSocialMachine(),
  // appends the audit event.
  await handleSocialAction("social.stop_machine", {}, actorId);
  return assembleSnapshot();
}

export async function clippingSnapshot(actorId: string): Promise<ClippingSnapshot> {
  return assembleSnapshot();
}

export async function listDrops(): Promise<MachineDrop[]> {
  return listMachineDrops();
}

export async function ingestDrop(
  actorId: string,
  dropId: string,
): Promise<{ assetId: string; duplicate: boolean }> {
  // dropId is the drop name (object key minus the machine-drop prefix);
  // ingestMachineDrop rebuilds the full key itself.
  return ingestMachineDrop({ actorId, dropName: dropId, clientId: null });
}

export type CrayoLoginCheck = { state: "unknown" | "logged_in" | "login_wall"; checkedAt: string };

/**
 * Guided-login status probe: open crayo.io on the ALREADY-RUNNING machine,
 * read the page through vision, classify, and persist the result. Never starts
 * the VM — getRunningSocialSandbox/openUrlInMachine throw MACHINE_STOPPED.
 */
export async function checkCrayoLogin(): Promise<CrayoLoginCheck> {
  await openUrlInMachine(DEFAULT_CRAYO_URL);
  // Let navigation settle before the vision pass (same pattern as
  // transferAndOpenUpload's post-open delay).
  const settled = Promise.withResolvers<void>();
  setTimeout(settled.resolve, 2500);
  await settled.promise;
  const summary = await browserGetPageSummary();
  const state = classifyCrayoPage(summary.summary);
  const checkedAt = new Date().toISOString();
  await writeAppSetting(CRAYO_LOGIN_STATE_KEY, state);
  await writeAppSetting(CRAYO_LOGIN_CHECKED_AT_KEY, checkedAt);
  return { state, checkedAt };
}

export type ClippingProcedureSkillSummary = {
  slug: string;
  name: string;
  description: string;
  version: string;
  stepCount: number;
};

/** Active skills whose scripts file map contains a parseable BrowserProcedure. */
export async function listClippingProcedureSkills(): Promise<ClippingProcedureSkillSummary[]> {
  const skills = await listPublicSkills();
  const summaries: ClippingProcedureSkillSummary[] = [];
  for (const skill of skills) {
    const procedure = parseBrowserProcedureFromScripts(skill.scripts);
    if (!procedure) continue;
    summaries.push({
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      version: skill.version,
      stepCount: procedure.steps.length,
    });
  }
  return summaries;
}

export async function runClippingProcedureSkill(input: {
  slug: string;
  actorId: string;
}): Promise<ExecuteBrowserProcedureResult> {
  const skill = await getSkillById(input.slug);
  if (!skill || !skill.enabled || skill.status !== "active") throw new Error("SKILL_MISSING");
  const procedure = parseBrowserProcedureFromScripts(skill.scripts);
  if (!procedure) throw new Error("NOT_A_BROWSER_PROCEDURE");
  return executeBrowserProcedure(procedure, {
    requestId: crypto.randomUUID(),
    actor: { source: "api", keyId: null, label: input.actorId },
    skillSlug: skill.slug,
  });
}
