/**
 * Clipping tab backend — cockpit APIs around the existing Social Machine VM
 * for crayo.io login and clip capture into the IPFS-pinned S3 library.
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
} from "@/lib/server/daytona.server";
import { handleSocialAction } from "@/lib/server/social-ops.server";
import {
  ingestMachineDrop,
  listMachineDrops,
  type MachineDrop,
} from "@/lib/server/storage-bridge.server";
import { crayoAvailable } from "@/lib/server/crayo.server";
import {
  isWindowsSnapshot,
  openUrlCommand,
  type SocialMachineOs,
} from "@/lib/social-machine";
import type { SocialMachineStatus } from "@/lib/social";

const DEFAULT_CRAYO_URL = "https://crayo.io";

export type ClippingSnapshot = {
  machine: SocialMachineStatus;
  crayoReady: boolean;
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
  return {
    machine,
    crayoReady,
    proxyConfigured: config?.proxyUrl != null,
    // Same availability rule as socialGetDesktopPreview (social.get_desktop_preview).
    desktopPreviewUrl:
      machine.state === "running" && Boolean(machine.previewUrl) ? machine.previewUrl : null,
    drops,
  };
}

/**
 * Open an arbitrary URL in the machine browser via the same command path
 * social.open_platform uses (openPlatformInMachine -> executeCommand with
 * openUrlCommand), reusing the daytona running-sandbox helper instead of
 * copying its status/config/client chain. Throws MACHINE_STOPPED and
 * DAYTONA_UNAVAILABLE verbatim when the machine is not usable.
 */
async function openUrlInMachine(url: string): Promise<void> {
  const { sandbox } = await getRunningSocialSandbox();
  // resolveOs's sandbox branch: windows snapshot -> windows, otherwise linux.
  const os: SocialMachineOs = isWindowsSnapshot(sandbox.snapshot) ? "windows" : "linux";
  await sandbox.process.executeCommand(openUrlCommand(os, url), undefined, undefined, 20);
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
