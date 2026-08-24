#!/usr/bin/env node
/**
 * Desktop sidecar builder.
 *
 * Builds the SAME TanStack Start app with Nitro's `node-server` preset (the
 * deploy uses `vercel`; this never touches that output), and stages a
 * self-contained directory at dist-desktop/server/ that runs with plain
 * `node server/index.mjs`.
 *
 * The Tauri bundle ships this directory next to the binary; src-tauri spawns
 * it on a loopback port and health-gates the window on /api/health.
 *
 * Output contract (consumed by tauri.conf.json):
 *   dist-desktop/index.html        — offline loading page shown pre-health
 *   dist-desktop/server/**         — staged sidecar (index.mjs + runtime)
 *
 * Testable pieces (no side effects on import): `desktopLoadingPageHtml`,
 * `stageSidecar`.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DESKTOP_DIST_DIR = "dist-desktop";

/** Offline first paint for the webview while the local engine boots. No external fetches. */
export function desktopLoadingPageHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>ClippyOS</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
         background: #04140e; color: #ecfdf5;
         font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .card { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .mark { width: 64px; height: 64px; animation: pulse 1.6s ease-in-out infinite; }
  h1 { font-size: 15px; font-weight: 600; letter-spacing: .12em; margin: 0; text-transform: uppercase; }
  p { margin: 0; font-size: 12px; color: #6ee7b7; opacity: .75; }
  @keyframes pulse { 50% { opacity: .55; } }
</style>
</head>
<body>
<div class="card">
  <svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#04140e"/>
    <polygon points="16,5 25.5,10.4 25.5,21.6 16,27 6.5,21.6 6.5,10.4" fill="#0b3d2c" stroke="#10b981" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M12.4 16.2a4.1 4.1 0 0 1 7.9-.4" fill="none" stroke="#ecfdf5" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M20.5 16.2a4.1 4.1 0 0 1-7.9.4" fill="none" stroke="#ecfdf5" stroke-width="2.1" stroke-linecap="round"/>
    <circle cx="16.4" cy="16.2" r="1.5" fill="#10b981"/>
  </svg>
  <h1>ClippyOS</h1>
  <p>Starting local engine&hellip;</p>
</div>
</body>
</html>
`;
}

/**
 * Stage `.output` (Nitro node-server output) into `<root>/dist-desktop`:
 * server entry at server/index.mjs plus the loading page at the root.
 * Copies ONLY the sidecar contract — `.output/server/**` and
 * `.output/package.json` — so stray workspace files can never leak into the
 * desktop bundle. Throws when the nitro build is missing its server entry so
 * `tauri build` never packages a shell without an engine.
 */
export function stageSidecar({ root }: { root?: string } = {}) {
  const projectRoot = root ?? join(dirname(fileURLToPath(import.meta.url)), "..");
  const nitroOut = join(projectRoot, ".output");
  const outDir = join(projectRoot, DESKTOP_DIST_DIR);
  const serverEntry = join(nitroOut, "server", "index.mjs");
  if (!existsSync(serverEntry)) {
    throw new Error(`desktop sidecar missing ${serverEntry} — run the node-server build first`);
  }
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, "server"), { recursive: true });
  cpSync(join(nitroOut, "server"), join(outDir, "server"), { recursive: true });
  const manifest = join(nitroOut, "package.json");
  if (existsSync(manifest)) {
    cpSync(manifest, join(outDir, "package.json"));
  }
  writeFileSync(join(outDir, "index.html"), desktopLoadingPageHtml());
  return { outDir, serverEntry: join(outDir, "server", "index.mjs") };
}

function fail(message: string) {
  console.error(`[desktop-server] ${message}`);
  process.exit(1);
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? await import("node:fs").then((fs) => fs.realpathSync(process.argv[1])) : "";
if (invoked && thisFile === invoked) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");

  // 1. Build with the node-server preset. patch-ssr-exports is skipped here on
  //    purpose: it hardcodes the .vercel function path and only fixes Rolldown's
  //    circular chunking, which inlineDynamicImports already avoids for node.
  const result = spawnSync("npx", ["vite", "build"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, NITRO_PRESET: "node-server" },
  });
  if (result.status !== 0) fail(`vite build failed (${result.status})`);

  // 2. Stage the self-contained sidecar.
  try {
    const staged = stageSidecar({ root });
    console.log("[desktop-server] staged", staged.outDir);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
