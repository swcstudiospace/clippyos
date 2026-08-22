import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { t as Daytona } from "../_libs/@daytona/sdk.mjs";
import { o as loadDaytonaConfig } from "./daytona.server-Ccwltk3g.mjs";
import { a as SKILL_ENV_DENY, i as SKILL_ENV_ALLOWLIST, r as SKILL_ARTIFACT_EXTS } from "./sandbox-DPO25eIO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skill-sandbox.server-DQUvCXDi.js
var SECRET_FIELD = /pass(word)?|cookie|secret|token|authorization|set-cookie/i;
function buildSkillSandboxEnv(input) {
	const env = {
		SKILL_ID: input.skillId.slice(0, 80),
		SKILL_VERSION: input.version.slice(0, 32),
		INPUT_PATH: input.inputPath,
		OUTPUT_DIR: input.outputDir
	};
	if (input.apiBase && /^https?:\/\//i.test(input.apiBase)) env.AGENCY_API_BASE = input.apiBase.replace(/\/$/, "");
	if (input.runToken) env.AGENCY_RUN_TOKEN = input.runToken;
	for (const key of Object.keys(env)) {
		if (!SKILL_ENV_ALLOWLIST.includes(key)) delete env[key];
		if (SKILL_ENV_DENY.includes(key)) delete env[key];
	}
	return env;
}
function formatEnvExports(env) {
	return Object.entries(env).map(([key, value]) => `${key}='${value.replace(/'/g, "")}'`).join(" ");
}
function artifactAllowed(name, size) {
	if (size > 2e6) return false;
	const lower = name.toLowerCase();
	if (SECRET_FIELD.test(lower)) return false;
	if (/(^|\/)(cookies?|logins?|passwords?|sessions?)(\.|$)/i.test(lower)) return false;
	const ext = lower.includes(".") ? `.${lower.split(".").pop()}` : "";
	return SKILL_ARTIFACT_EXTS.includes(ext);
}
/**
* Isolated Python skill execution via a short-lived Daytona sandbox.
* NEVER starts or reuses the Social Machine.
*/
var MAX_OUTPUT = 32e3;
var MAX_SCRIPT = 8e4;
var SKILL_LABELS = {
	app: "clippy-admin",
	purpose: "skill",
	clippy: "skill-runtime"
};
function clip(value) {
	if (value.length <= MAX_OUTPUT) return value;
	return `${value.slice(0, MAX_OUTPUT)}\n…truncated`;
}
function safeRelPath(path) {
	const cleaned = path.replace(/\\/g, "/").replace(/^\/+/, "");
	if (!cleaned || cleaned.includes("..") || cleaned.startsWith("/")) return null;
	if (!/^(scripts|references|templates|assets)\//.test(cleaned) && cleaned !== "SKILL.md") {
		if (!cleaned.endsWith(".py") && !cleaned.endsWith(".md") && !cleaned.endsWith(".txt")) return null;
	}
	return cleaned.replace(/[^a-zA-Z0-9._/-]/g, "_");
}
async function runPythonInSkillSandbox(input) {
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const scripts = Object.entries(input.scripts);
	if (scripts.some(([, code]) => code.length > MAX_SCRIPT)) throw new Error("SKILL_TOO_LARGE");
	const daytona = new Daytona({
		apiKey: config.apiKey,
		apiUrl: config.apiUrl,
		...config.target ? { target: config.target } : {},
		useDeprecatedPolling: true,
		requestTimeoutMs: 2e4
	});
	const timeoutSec = Math.min(Math.max(input.timeoutSec || 120, 5), 600);
	const started = Date.now();
	let sandbox = null;
	try {
		sandbox = await daytona.create({
			language: "python",
			autoStopInterval: 5,
			labels: {
				...SKILL_LABELS,
				skill: sanitizeText(input.slug).slice(0, 40)
			},
			public: false
		});
		const root = "/home/daytona/skill";
		const exec = async (cmd, timeout = 20) => {
			if (sandbox.process?.executeCommand) return sandbox.process.executeCommand(cmd, void 0, timeout * 1e3);
			return sandbox.process.execute(cmd);
		};
		await exec(`mkdir -p ${root}/scripts ${root}/references ${root}/templates ${root}/assets ${root}/output`, 15);
		const writeFile = async (rel, body) => {
			const path = `${root}/${rel}`;
			const dir = path.slice(0, path.lastIndexOf("/"));
			await exec(`mkdir -p '${dir.replace(/'/g, `'\\''`)}'`, 10);
			if (sandbox.fs?.uploadFile) await sandbox.fs.uploadFile(Buffer.from(body, "utf8"), path);
			else {
				const b64 = Buffer.from(body, "utf8").toString("base64");
				await exec(`python3 -c "import pathlib,base64; pathlib.Path('${path}').write_bytes(base64.b64decode('${b64}'))"`);
			}
		};
		await writeFile("SKILL.md", input.skillMd.slice(0, 2e5));
		await writeFile("inputs.json", JSON.stringify(input.args ?? {}));
		for (const [name, body] of scripts) {
			const rel = name.includes("/") ? safeRelPath(name) : `scripts/${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
			if (!rel) continue;
			await writeFile(rel, body);
		}
		for (const [name, body] of Object.entries(input.references ?? {})) {
			const rel = safeRelPath(name.startsWith("references/") ? name : `references/${name}`);
			if (rel) await writeFile(rel, String(body).slice(0, 8e4));
		}
		for (const [name, body] of Object.entries(input.templates ?? {})) {
			const rel = safeRelPath(name.startsWith("templates/") ? name : `templates/${name}`);
			if (rel) await writeFile(rel, String(body).slice(0, 8e4));
		}
		const entry = input.entrypoint?.replace(/\.\./g, "") || (input.scripts["scripts/main.py"] || input.scripts["main.py"] ? "scripts/main.py" : null) || (scripts.find(([name]) => name.endsWith(".py"))?.[0] ? `scripts/${scripts.find(([name]) => name.endsWith(".py"))[0].split("/").pop()}` : "scripts/main.py");
		const result = await exec(`${input.network ? "" : "export http_proxy= https_proxy= HTTP_PROXY= HTTPS_PROXY= NO_PROXY=* ALL_PROXY=; "}cd ${root} && ${formatEnvExports(buildSkillSandboxEnv({
			skillId: input.skillId,
			version: input.version,
			inputPath: `${root}/inputs.json`,
			outputDir: `${root}/output`
		}))} python3 ${entry} < inputs.json`, timeoutSec);
		const stdout = clip(String(result?.result ?? result?.stdout ?? result?.output ?? ""));
		const stderr = clip(String(result?.stderr ?? result?.error ?? ""));
		const exitCode = Number(result?.exitCode ?? result?.code ?? 0);
		const artifacts = [];
		try {
			const listing = await exec(`python3 - <<'PY'
import json, os
root = "${root}/output"
out = []
if os.path.isdir(root):
    for name in sorted(os.listdir(root))[:20]:
        path = os.path.join(root, name)
        if os.path.isfile(path):
            out.append({"name": name, "size": os.path.getsize(path)})
print(json.dumps(out))
PY`, 15);
			const raw = String(listing?.result ?? listing?.stdout ?? "[]");
			const parsed = JSON.parse(raw.slice(raw.indexOf("[")));
			for (const row of parsed) {
				if (!artifactAllowed(row.name, row.size)) continue;
				artifacts.push({
					name: row.name.slice(0, 80),
					size: row.size
				});
			}
		} catch {}
		return {
			stdout,
			stderr,
			exitCode: Number.isFinite(exitCode) ? exitCode : 1,
			durationMs: Date.now() - started,
			artifacts
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "SKILL_EXEC_FAILED";
		if (message === "DAYTONA_UNAVAILABLE" || message === "SKILL_TOO_LARGE") throw error;
		throw new Error("SKILL_EXEC_FAILED");
	} finally {
		try {
			if (sandbox?.stop) await sandbox.stop();
		} catch {}
		try {
			if (sandbox?.delete) await sandbox.delete();
		} catch {}
	}
}
//#endregion
export { runPythonInSkillSandbox };
