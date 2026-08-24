#!/usr/bin/env node
/**
 * Production 500 fixer for TanStack Start + Nitro + Rolldown.
 *
 * Rolldown sometimes splits the SSR entry into circular chunks:
 *
 *   ssr-renderer → import("../_ssr/ssr.mjs").then((n) => n.u)
 *   ssr.mjs      → export { ssr_exports as u }   // ssr_exports never defined
 *
 * Node then throws `SyntaxError: Export 'ssr_exports' is not defined in module`
 * and Nitro returns `{ error: true, status: 500, unhandled: true }` for every
 * document AND API request. This script rewrites the broken binding after
 * `vite build` and copies PGLite WASM next to the function so inlined bundles
 * can still boot without DATABASE_URL.
 */
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const FUNC_REL = ".vercel/output/functions/__server.func";

const PGLITE_ASSETS = ["pglite.data", "pglite.wasm", "initdb.wasm"];

export function projectRoot(from = import.meta.url) {
  return dirname(dirname(fileURLToPath(from)));
}

function walkJs(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkJs(path, acc);
    else if (/\.(mjs|js|cjs)$/.test(entry.name)) acc.push(path);
  }
  return acc;
}

/** True when the file exports `ssr_exports` without ever binding it. */
export function missingSsrExportsBinding(src: string) {
  if (!/\bssr_exports\s+as\s+u\b/.test(src)) return false;
  return !/\b(?:var|let|const|function)\s+ssr_exports\b/.test(src) && !/\bssr_exports\s*=/.test(src);
}

/**
 * Rewrite a single compiled file. Returns the patched source, or `null` if
 * nothing changed.
 */
export function patchSsrSource(src: string) {
  let next = src;

  // Nitro's ssr-renderer asks for the `u` export. Use the module itself so
  // lazyService can take `_mod.default` (server_default) instead of the
  // missing live binding.
  next = next.replace(
    /import\((["'][^"']*ssr\.mjs["'])\)\.then\(\((\w+)\)\s*=>\s*\2\.u\)/g,
    "import($1)",
  );

  if (missingSsrExportsBinding(next)) {
    if (/\bserver_default\b/.test(next)) {
      next = next.replace(/\bssr_exports\s+as\s+u\b/g, "server_default as u");
    } else {
      next = next.replace(/\bssr_exports\s+as\s+u\b/g, "default as u");
    }
  }

  return next === src ? null : next;
}

export function copyPgliteAssets(root: string, funcDir: string) {
  const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
  const copied: string[] = [];
  if (!existsSync(funcDir) || !existsSync(srcDir)) return copied;
  const bundle = join(funcDir, "index.mjs");
  if (!existsSync(bundle)) return copied;
  // Only copy when the compiled function actually references the WASM payload.
  const src = readFileSync(bundle, "utf8");
  if (!src.includes("pglite.data")) return copied;
  for (const file of PGLITE_ASSETS) {
    const from = join(srcDir, file);
    if (!existsSync(from)) continue;
    copyFileSync(from, join(funcDir, file));
    copied.push(file);
  }
  return copied;
}

export function patchSsrExports(root = projectRoot()) {
  const funcDir = join(root, FUNC_REL);
  const patched: string[] = [];
  if (existsSync(funcDir)) {
    for (const file of walkJs(funcDir)) {
      const src = readFileSync(file, "utf8");
      const next = patchSsrSource(src);
      if (!next) continue;
      writeFileSync(file, next);
      patched.push(file.slice(root.length + 1));
    }
  }
  const pglite = copyPgliteAssets(root, funcDir);
  return { patched, pglite, funcDir };
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1]
  ? (await import("node:fs")).realpathSync(process.argv[1])
  : "";
if (invoked && thisFile === invoked) {
  const result = patchSsrExports();
  if (!existsSync(result.funcDir)) {
    console.log("[patch-ssr] no vercel function dir — skip");
    process.exit(0);
  }
  for (const file of result.patched) console.log("[patch-ssr] patched", file);
  if (result.pglite.length) console.log("[patch-ssr] copied", result.pglite.join(", "));
  console.log(`[patch-ssr] done — ${result.patched.length} file(s)`);
}

