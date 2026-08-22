import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import {
  BUILTIN_ADDONS,
  validateManifest,
  type AddonManifest,
  type AddonRuntimeState,
} from "@/lib/addons";

const DISABLED_KEY = "ADDONS_DISABLED_JSON";
const INSTALLED_KEY = "ADDONS_INSTALLED_JSON";
const GEN_KEY = "MCP_TOOLS_GENERATION";

export async function bumpToolsGeneration(): Promise<number> {
  const current = Number((await readAppSetting(GEN_KEY)) ?? "0") || 0;
  const next = current + 1;
  await writeAppSetting(GEN_KEY, String(next));
  return next;
}

export async function readToolsGeneration(): Promise<number> {
  return Number((await readAppSetting(GEN_KEY)) ?? "0") || 0;
}

async function readDisabled(): Promise<Set<string>> {
  const raw = await readAppSetting(DISABLED_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String));
  } catch {
    return new Set();
  }
}

async function writeDisabled(ids: Set<string>): Promise<void> {
  await writeAppSetting(DISABLED_KEY, JSON.stringify([...ids]));
  await bumpToolsGeneration();
}

async function readInstalled(): Promise<AddonManifest[]> {
  const raw = await readAppSetting(INSTALLED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => validateManifest(item))
      .filter((row): row is { ok: true; manifest: AddonManifest } => row.ok)
      .map((row) => row.manifest);
  } catch {
    return [];
  }
}

export async function listAddonManifests(): Promise<AddonManifest[]> {
  const installed = await readInstalled();
  const byId = new Map<string, AddonManifest>();
  for (const row of BUILTIN_ADDONS) byId.set(row.id, row);
  for (const row of installed) byId.set(row.id, row);
  return [...byId.values()];
}

export async function isAddonEnabled(id: string): Promise<boolean> {
  const manifest = (await listAddonManifests()).find((row) => row.id === id);
  if (!manifest) return false;
  if (manifest.locked) return true;
  const disabled = await readDisabled();
  return !disabled.has(id);
}

export async function enabledAddonIds(): Promise<Set<string>> {
  const disabled = await readDisabled();
  const ids = new Set<string>();
  for (const row of await listAddonManifests()) {
    if (row.locked || !disabled.has(row.id)) ids.add(row.id);
  }
  return ids;
}

export async function buildAddonsSnapshot(): Promise<{
  items: Array<{ manifest: AddonManifest; state: AddonRuntimeState }>;
  generation: number;
}> {
  const [manifests, disabled, generation] = await Promise.all([
    listAddonManifests(),
    readDisabled(),
    readToolsGeneration(),
  ]);
  const items = manifests.map((manifest) => {
    const state: AddonRuntimeState = {
      id: manifest.id,
      enabled: manifest.locked ? true : !disabled.has(manifest.id),
      installed: !BUILTIN_ADDONS.some((row) => row.id === manifest.id),
      source: BUILTIN_ADDONS.some((row) => row.id === manifest.id) ? "builtin" : "installed",
    };
    return { manifest, state };
  });
  return { items, generation };
}

export async function setAddonEnabledInternal(data: { id: string; enabled: boolean }) {
  const manifests = await listAddonManifests();
  const manifest = manifests.find((row) => row.id === data.id);
  if (!manifest) throw new Error("ADDON_MISSING");
  if (manifest.locked || manifest.required) throw new Error("ADDON_LOCKED");
  const disabled = await readDisabled();
  if (data.enabled) disabled.delete(data.id);
  else disabled.add(data.id);
  await writeDisabled(disabled);
  return { ok: true as const, enabled: data.enabled };
}

export async function installAddonManifestInternal(raw: unknown) {
  const parsed = validateManifest(raw);
  if (!parsed.ok) throw new Error("ADDON_INVALID");
  if (BUILTIN_ADDONS.some((row) => row.id === parsed.manifest.id)) {
    throw new Error("ADDON_BUILTIN");
  }
  const installed = await readInstalled();
  const next = [...installed.filter((row) => row.id !== parsed.manifest.id), parsed.manifest];
  await writeAppSetting(INSTALLED_KEY, JSON.stringify(next));
  await bumpToolsGeneration();
  return { ok: true as const, id: parsed.manifest.id };
}
