/**
 * Isolated Python skill execution via a short-lived Daytona sandbox.
 * NEVER starts or reuses the Social Machine.
 */
import { Daytona } from "@daytona/sdk";
import { loadDaytonaConfig } from "@/lib/server/daytona.server";
import { sanitizeText } from "@/lib/sanitize";
import { artifactAllowed, buildSkillSandboxEnv, formatEnvExports } from "@/lib/server/sandbox-security.server";
import { SKILL_SANDBOX_AUTOSTOP_MINUTES } from "@/lib/sandbox";

export type SkillArtifact = { name: string; size: number };

export type SkillExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  artifacts: SkillArtifact[];
};

const MAX_OUTPUT = 32_000;
const MAX_SCRIPT = 80_000;
const SKILL_LABELS = { app: "clippy-admin", purpose: "skill", clippy: "skill-runtime" };

function clip(value: string): string {
  if (value.length <= MAX_OUTPUT) return value;
  return `${value.slice(0, MAX_OUTPUT)}\n…truncated`;
}

function safeRelPath(path: string): string | null {
  const cleaned = path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleaned || cleaned.includes("..") || cleaned.startsWith("/")) return null;
  if (!/^(scripts|references|templates|assets)\//.test(cleaned) && cleaned !== "SKILL.md") {
    if (!cleaned.endsWith(".py") && !cleaned.endsWith(".md") && !cleaned.endsWith(".txt")) return null;
  }
  return cleaned.replace(/[^a-zA-Z0-9._/-]/g, "_");
}

export async function runPythonInSkillSandbox(input: {
  slug: string;
  skillId: string;
  version: string;
  skillMd: string;
  scripts: Record<string, string>;
  references?: Record<string, string>;
  templates?: Record<string, string>;
  args: Record<string, unknown>;
  timeoutSec: number;
  network: boolean;
  entrypoint?: string;
}): Promise<SkillExecResult> {
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");

  const scripts = Object.entries(input.scripts);
  if (scripts.some(([, code]) => code.length > MAX_SCRIPT)) throw new Error("SKILL_TOO_LARGE");

  const daytona = new Daytona({
    apiKey: config.apiKey,
    apiUrl: config.apiUrl,
    ...(config.target ? { target: config.target } : {}),
    useDeprecatedPolling: true,
    requestTimeoutMs: 20_000,
  });

  const timeoutSec = Math.min(Math.max(input.timeoutSec || 120, 5), 600);
  const started = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sandbox: any = null;
  try {
    sandbox = await daytona.create({
      language: "python",
      autoStopInterval: SKILL_SANDBOX_AUTOSTOP_MINUTES,
      labels: { ...SKILL_LABELS, skill: sanitizeText(input.slug).slice(0, 40) },
      public: false,
    } as never);

    const root = "/home/daytona/skill";
    const exec = async (cmd: string, timeout = 20) => {
      if (sandbox.process?.executeCommand) {
        return sandbox.process.executeCommand(cmd, undefined, timeout * 1000);
      }
      return sandbox.process.execute(cmd);
    };

    await exec(
      `mkdir -p ${root}/scripts ${root}/references ${root}/templates ${root}/assets ${root}/output`,
      15,
    );

    const writeFile = async (rel: string, body: string) => {
      const path = `${root}/${rel}`;
      const dir = path.slice(0, path.lastIndexOf("/"));
      await exec(`mkdir -p '${dir.replace(/'/g, `'\\''`)}'`, 10);
      if (sandbox.fs?.uploadFile) {
        await sandbox.fs.uploadFile(Buffer.from(body, "utf8"), path);
      } else {
        const b64 = Buffer.from(body, "utf8").toString("base64");
        await exec(
          `python3 -c "import pathlib,base64; pathlib.Path('${path}').write_bytes(base64.b64decode('${b64}'))"`,
        );
      }
    };

    await writeFile("SKILL.md", input.skillMd.slice(0, 200_000));
    await writeFile("inputs.json", JSON.stringify(input.args ?? {}));
    for (const [name, body] of scripts) {
      const rel = name.includes("/") ? safeRelPath(name) : `scripts/${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      if (!rel) continue;
      await writeFile(rel, body);
    }
    for (const [name, body] of Object.entries(input.references ?? {})) {
      const rel = safeRelPath(name.startsWith("references/") ? name : `references/${name}`);
      if (rel) await writeFile(rel, String(body).slice(0, 80_000));
    }
    for (const [name, body] of Object.entries(input.templates ?? {})) {
      const rel = safeRelPath(name.startsWith("templates/") ? name : `templates/${name}`);
      if (rel) await writeFile(rel, String(body).slice(0, 80_000));
    }

    const entry =
      input.entrypoint?.replace(/\.\./g, "") ||
      (input.scripts["scripts/main.py"] || input.scripts["main.py"] ? "scripts/main.py" : null) ||
      (scripts.find(([name]) => name.endsWith(".py"))?.[0]
        ? `scripts/${(scripts.find(([name]) => name.endsWith(".py"))![0]).split("/").pop()}`
        : "scripts/main.py");

    const netGuard = input.network
      ? ""
      : "export http_proxy= https_proxy= HTTP_PROXY= HTTPS_PROXY= NO_PROXY=* ALL_PROXY=; ";
    const envMap = buildSkillSandboxEnv({
      skillId: input.skillId,
      version: input.version,
      inputPath: `${root}/inputs.json`,
      outputDir: `${root}/output`,
    });
    const env = formatEnvExports(envMap);
    const cmd = `${netGuard}cd ${root} && ${env} python3 ${entry} < inputs.json`;
    const result = await exec(cmd, timeoutSec);
    const stdout = clip(String(result?.result ?? result?.stdout ?? result?.output ?? ""));
    const stderr = clip(String(result?.stderr ?? result?.error ?? ""));
    const exitCode = Number(result?.exitCode ?? result?.code ?? 0);

    const artifacts: SkillArtifact[] = [];
    try {
      const listing = await exec(
        `python3 - <<'PY'
import json, os
root = "${root}/output"
out = []
if os.path.isdir(root):
    for name in sorted(os.listdir(root))[:20]:
        path = os.path.join(root, name)
        if os.path.isfile(path):
            out.append({"name": name, "size": os.path.getsize(path)})
print(json.dumps(out))
PY`,
        15,
      );
      const raw = String(listing?.result ?? listing?.stdout ?? "[]");
      const parsed = JSON.parse(raw.slice(raw.indexOf("["))) as SkillArtifact[];
      for (const row of parsed) {
        if (!artifactAllowed(row.name, row.size)) continue;
        artifacts.push({ name: row.name.slice(0, 80), size: row.size });
      }
    } catch {
      /* artifacts optional */
    }

    return {
      stdout,
      stderr,
      exitCode: Number.isFinite(exitCode) ? exitCode : 1,
      durationMs: Date.now() - started,
      artifacts,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SKILL_EXEC_FAILED";
    if (message === "DAYTONA_UNAVAILABLE" || message === "SKILL_TOO_LARGE") throw error;
    throw new Error("SKILL_EXEC_FAILED");
  } finally {
    try {
      if (sandbox?.stop) await sandbox.stop();
    } catch {
      /* ignore */
    }
    try {
      if (sandbox?.delete) await sandbox.delete();
    } catch {
      /* ephemeral */
    }
  }
}

/** @deprecated prefer the package runner */
export async function runPythonScript(input: {
  slug: string;
  scriptName: string;
  code: string;
  stdin: string;
  timeoutSec: number;
  network: boolean;
}): Promise<SkillExecResult> {
  return runPythonInSkillSandbox({
    slug: input.slug,
    skillId: input.slug,
    version: "0",
    skillMd: "",
    scripts: { [input.scriptName]: input.code },
    args: (() => {
      try {
        return JSON.parse(input.stdin || "{}") as Record<string, unknown>;
      } catch {
        return {};
      }
    })(),
    timeoutSec: input.timeoutSec,
    network: input.network,
    entrypoint: `scripts/${input.scriptName}`,
  });
}
