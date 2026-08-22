import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as validateManifest, n as BUILTIN_ADDONS } from "./addons-BHnLQdrp.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/addons.server-DwUuR_Y2.js
var addons_server_DwUuR_Y2_exports = /* @__PURE__ */ __exportAll({
	n: () => bumpToolsGeneration,
	t: () => addons_server_exports
});
var addons_server_exports = /* @__PURE__ */ __exportAll$1({
	buildAddonsSnapshot: () => buildAddonsSnapshot,
	bumpToolsGeneration: () => bumpToolsGeneration,
	enabledAddonIds: () => enabledAddonIds,
	installAddonManifestInternal: () => installAddonManifestInternal,
	listAddonManifests: () => listAddonManifests,
	readToolsGeneration: () => readToolsGeneration,
	setAddonEnabledInternal: () => setAddonEnabledInternal
});
var DISABLED_KEY = "ADDONS_DISABLED_JSON";
var INSTALLED_KEY = "ADDONS_INSTALLED_JSON";
var GEN_KEY = "MCP_TOOLS_GENERATION";
async function bumpToolsGeneration() {
	const next = (Number(await readAppSetting(GEN_KEY) ?? "0") || 0) + 1;
	await writeAppSetting(GEN_KEY, String(next));
	return next;
}
async function readToolsGeneration() {
	return Number(await readAppSetting(GEN_KEY) ?? "0") || 0;
}
async function readDisabled() {
	const raw = await readAppSetting(DISABLED_KEY);
	if (!raw) return /* @__PURE__ */ new Set();
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return /* @__PURE__ */ new Set();
		return new Set(parsed.map(String));
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
async function writeDisabled(ids) {
	await writeAppSetting(DISABLED_KEY, JSON.stringify([...ids]));
	await bumpToolsGeneration();
}
async function readInstalled() {
	const raw = await readAppSetting(INSTALLED_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.map((item) => validateManifest(item)).filter((row) => row.ok).map((row) => row.manifest);
	} catch {
		return [];
	}
}
async function listAddonManifests() {
	const installed = await readInstalled();
	const byId = /* @__PURE__ */ new Map();
	for (const row of BUILTIN_ADDONS) byId.set(row.id, row);
	for (const row of installed) byId.set(row.id, row);
	return [...byId.values()];
}
async function enabledAddonIds() {
	const disabled = await readDisabled();
	const ids = /* @__PURE__ */ new Set();
	for (const row of await listAddonManifests()) if (row.locked || !disabled.has(row.id)) ids.add(row.id);
	return ids;
}
async function buildAddonsSnapshot() {
	const [manifests, disabled, generation] = await Promise.all([
		listAddonManifests(),
		readDisabled(),
		readToolsGeneration()
	]);
	return {
		items: manifests.map((manifest) => {
			return {
				manifest,
				state: {
					id: manifest.id,
					enabled: manifest.locked ? true : !disabled.has(manifest.id),
					installed: !BUILTIN_ADDONS.some((row) => row.id === manifest.id),
					source: BUILTIN_ADDONS.some((row) => row.id === manifest.id) ? "builtin" : "installed"
				}
			};
		}),
		generation
	};
}
async function setAddonEnabledInternal(data) {
	const manifest = (await listAddonManifests()).find((row) => row.id === data.id);
	if (!manifest) throw new Error("ADDON_MISSING");
	if (manifest.locked || manifest.required) throw new Error("ADDON_LOCKED");
	const disabled = await readDisabled();
	if (data.enabled) disabled.delete(data.id);
	else disabled.add(data.id);
	await writeDisabled(disabled);
	return {
		ok: true,
		enabled: data.enabled
	};
}
async function installAddonManifestInternal(raw) {
	const parsed = validateManifest(raw);
	if (!parsed.ok) throw new Error("ADDON_INVALID");
	if (BUILTIN_ADDONS.some((row) => row.id === parsed.manifest.id)) throw new Error("ADDON_BUILTIN");
	const next = [...(await readInstalled()).filter((row) => row.id !== parsed.manifest.id), parsed.manifest];
	await writeAppSetting(INSTALLED_KEY, JSON.stringify(next));
	await bumpToolsGeneration();
	return {
		ok: true,
		id: parsed.manifest.id
	};
}
//#endregion
export { bumpToolsGeneration as n, addons_server_DwUuR_Y2_exports as t };
