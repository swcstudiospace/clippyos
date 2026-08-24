/**
 * Storage Bridge — the S3/IPFS bucket as the persistent layer between the
 * Dashboard and the nested Social Machine.
 *
 * Dashboard writes library bytes to the backend (supabase → s3 → local). The
 * Social Machine mounts the same S3-compatible bucket as a network drive via
 * rclone (Y:\ on Windows, /home/daytona/library on Linux), so Crayo clips and
 * thumbnails produced inside the machine's browser are "copied between" both
 * sides by dropping files in machine-drops/. The dashboard ingests from there.
 *
 * Secrets never appear in tool results; they are embedded only in the
 * machine-scoped rclone config written to a protected path on the VM.
 */
import {
  MACHINE_DROP_PREFIX,
  bucketMountScript,
  ensureBridgeDirsCommand,
  machineDropKey,
  verifyMachineMountCommand,
} from "@/lib/social-machine";
import { sanitizeText } from "@/lib/sanitize";

const BRIDGE_STATE_KEY = "LIBRARY_BRIDGE_MOUNTED";
const BRIDGE_CHECKED_AT_KEY = "LIBRARY_BRIDGE_CHECKED_AT";
const DROP_SCAN_LIMIT = 40;

function nowIso() {
  return new Date().toISOString();
}

async function readBridgeState(): Promise<boolean | null> {
  const { readAppSetting } = await import("@/lib/server/app-settings.server");
  const raw = (await readAppSetting(BRIDGE_STATE_KEY))?.trim();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

async function writeBridgeState(mounted: boolean): Promise<void> {
  const { writeAppSetting } = await import("@/lib/server/app-settings.server");
  await writeAppSetting(BRIDGE_STATE_KEY, mounted ? "true" : "false");
  await writeAppSetting(BRIDGE_CHECKED_AT_KEY, nowIso());
}

export type StorageBridgeStatus = {
  configured: boolean;
  bucket: string | null;
  endpoint: string | null;
  machineRunning: boolean;
  mounted: boolean | null;
  checkedAt: string | null;
  note: string;
};

export async function storageBridgeStatus(): Promise<StorageBridgeStatus> {
  const { publicS3Status } = await import("@/lib/server/library-storage.server");
  const { getSocialMachineStatus } = await import("@/lib/server/daytona.server");
  const { bridgeStatusNote } = await import("@/lib/social-machine");
  const [s3, machine] = await Promise.all([publicS3Status(), getSocialMachineStatus()]);
  const mounted = await readBridgeState();
  const { readAppSetting } = await import("@/lib/server/app-settings.server");
  return {
    configured: s3.configured,
    bucket: s3.bucket,
    endpoint: s3.endpoint,
    machineRunning: machine.state === "running",
    mounted,
    checkedAt: (await readAppSetting(BRIDGE_CHECKED_AT_KEY))?.trim() || null,
    note: bridgeStatusNote(s3.configured, mounted),
  };
}

/**
 * Apply + verify the network-drive mount on the running Social Machine.
 * Idempotent: the mount script short-circuits when the drive already exists.
 * When the machine is stopped this records mounted=false honestly.
 */
export async function applyStorageBridge(): Promise<StorageBridgeStatus & { applied: boolean; error: string | null }> {
  const { loadS3Config } = await import("@/lib/server/library-storage.server");
  const { getSocialMachineStatus, loadDaytonaConfig, createClient, sanitizeDaytonaError } = await import(
    "@/lib/server/daytona.server"
  );
  const base = await storageBridgeStatus();

  const s3 = await loadS3Config();
  if (!s3) return { ...base, applied: false, error: "STORAGE_UNCONFIGURED" };

  const status = await getSocialMachineStatus();
  if (status.state !== "running" || !status.sandboxId) {
    await writeBridgeState(false);
    return { ...base, applied: false, error: "MACHINE_STOPPED" };
  }
  const config = await loadDaytonaConfig();
  if (!config) return { ...base, applied: false, error: "DAYTONA_UNAVAILABLE" };

  const daytona = createClient(config);
  let sandbox: Awaited<ReturnType<typeof daytona.get>>;
  try {
    sandbox = await daytona.get(status.sandboxId);
  } catch (error) {
    return { ...base, applied: false, error: sanitizeDaytonaError(error instanceof Error ? error.message : "") };
  }

  const os = status.os === "linux" ? "linux" : "windows";
  const script = bucketMountScript(os, s3);
  try {
    await sandbox.process.executeCommand(script, undefined, undefined, 180);
    const probe = await sandbox.process.executeCommand(verifyMachineMountCommand(os), undefined, undefined, 30);
    if (!/bridge-ok|mount-ok|mount-present/.test(String(probe?.result ?? ""))) {
      // Bootstrap the drop dir so verification has something to stat, then re-probe.
      await sandbox.process.executeCommand(ensureBridgeDirsCommand(os), undefined, undefined, 30);
      const probe2 = await sandbox.process.executeCommand(verifyMachineMountCommand(os), undefined, undefined, 30);
      const okNow = /bridge-ok/.test(String(probe2?.result ?? ""));
      await writeBridgeState(okNow);
      return { ...base, applied: okNow, error: okNow ? null : "BRIDGE_NOT_MOUNTED" };
    }
    await writeBridgeState(true);
    return { ...base, applied: true, error: null };
  } catch (error) {
    await writeBridgeState(false);
    const message = sanitizeDaytonaError(error instanceof Error ? error.message : "BRIDGE_FAILED");
    return { ...base, applied: false, error: message };
  }
}

export type MachineDrop = {
  key: string;
  name: string;
  sizeBytes: number;
  modifiedAt: string | null;
};

/** List machine-dropped artifacts straight from the S3 backend (machine need not be running). */
export async function listMachineDrops(prefix = MACHINE_DROP_PREFIX): Promise<MachineDrop[]> {
  const { loadS3Config } = await import("@/lib/server/library-storage.server");
  const s3 = await loadS3Config();
  if (!s3) return [];
  try {
    const { s3List } = await import("@/lib/server/s3.server");
    const rows = await s3List(s3, `${prefix}/`, DROP_SCAN_LIMIT);
    return rows.map((row) => ({
      key: row.key,
      name: row.key.slice(`${prefix}/`.length),
      sizeBytes: row.sizeBytes,
      modifiedAt: row.modifiedAt,
    }));
  } catch {
    return [];
  }
}

/**
 * Ingest one dropped artifact into the Library. Reads the object from the
 * backend (the same place the machine wrote it) and routes through the
 * standard ingest pipeline with source AGENT and a machine-drop tag.
 */
export async function ingestMachineDrop(input: {
  actorId: string;
  dropName: string;
  clientId: string | null;
  title?: string;
}): Promise<{ assetId: string; duplicate: boolean }> {
  const { loadS3Config } = await import("@/lib/server/library-storage.server");
  const s3 = await loadS3Config();
  if (!s3) throw new Error("STORAGE_UNCONFIGURED");
  const key = machineDropKey(input.dropName);
  const { s3Get } = await import("@/lib/server/s3.server");
  const bytes = await s3Get(s3, key);
  if (!bytes) throw new Error("ASSET_MISSING");
  const { ingestBytes } = await import("@/lib/server/library-pipeline.server");
  const ext = input.dropName.split(".").pop()?.toLowerCase() ?? "";
  const mimeHint =
    ext === "mp4" || ext === "mov" || ext === "webm"
      ? `video/${ext === "mov" ? "quicktime" : ext}`
      : ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp"
        ? `image/${ext === "jpg" ? "jpeg" : ext}`
        : ext === "srt"
          ? "application/x-subrip"
          : ext === "vtt"
            ? "text/vtt"
            : undefined;
  const result = await ingestBytes({
    actorId: input.actorId,
    clientId: input.clientId,
    title: sanitizeText(input.title || input.dropName.replace(/\.[^.]+$/, "")).slice(0, 160) || "Machine clip",
    filename: input.dropName,
    mimeHint,
    bytes,
    source: "AGENT",
    sourceRef: `s3://${key}`,
    tags: ["machine-drop"],
  });
  return { assetId: result.asset.id, duplicate: result.duplicate };
}
