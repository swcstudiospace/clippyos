/**
 * Node module customization hook: resolves the `@/*` -> `./src/*` alias that Vite and tsconfig
 * already define (tsconfig.json compilerOptions.paths), so `.server.ts` modules that import
 * sibling app code via `@/...` can be loaded directly by `node --test` (which has no concept of
 * bundler path aliases). Registered by scripts/register-test-aliases.mjs.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC_ROOT = new URL("../src/", import.meta.url);

function resolveAliasedPath(rel) {
  const asIs = new URL(rel, SRC_ROOT);
  if (existsSync(fileURLToPath(asIs))) return asIs;
  const withExt = new URL(`${rel}.ts`, SRC_ROOT);
  if (existsSync(fileURLToPath(withExt))) return withExt;
  return asIs;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = resolveAliasedPath(specifier.slice(2));
    return nextResolve(pathToFileURL(fileURLToPath(target)).href, context);
  }
  return nextResolve(specifier, context);
}
