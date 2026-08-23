import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { missingSsrExportsBinding, patchSsrSource } from "./patch-ssr-exports.mjs";

test("detects the live circular ssr_exports re-export", () => {
  const src = `import { l as server_default } from "./ssr2.mjs";
export { server_default as default, ssr_exports as u };
`;
  assert.equal(missingSsrExportsBinding(src), true);
});

test("does not flag a defined ssr_exports binding", () => {
  const src = `var ssr_exports = { default: server_default };
export { ssr_exports as u };
`;
  assert.equal(missingSsrExportsBinding(src), false);
});

test("rewrites renderer to import the SSR module, not n.u", () => {
  const src = `var viteServices = { ["ssr"]: lazyService(() => import("../_ssr/ssr.mjs").then((n) => n.u)) };`;
  const next = patchSsrSource(src);
  assert.ok(next);
  assert.match(next, /import\("\.\.\/_ssr\/ssr\.mjs"\)/);
  assert.doesNotMatch(next, /\.then\(\(n\) => n\.u\)/);
});

test("aliases missing ssr_exports to server_default", () => {
  const src = `import { l as server_default } from "./ssr2.mjs";
export { getServerFnById as a, server_default as default, ssr_exports as u };
`;
  const next = patchSsrSource(src);
  assert.ok(next);
  assert.match(next, /server_default as u/);
  assert.doesNotMatch(next, /ssr_exports as u/);
});

test("round-trips a temp copy of the published ssr.mjs shape", () => {
  const dir = mkdtempSync(join(tmpdir(), "ssr-patch-"));
  mkdirSync(join(dir, "_ssr"), { recursive: true });
  const ssr = join(dir, "_ssr", "ssr.mjs");
  writeFileSync(
    ssr,
    `import { l as server_default } from "./ssr2.mjs";\nexport { server_default as default, ssr_exports as u };\n`,
  );
  const renderer = join(dir, "_chunks", "ssr-renderer.mjs");
  mkdirSync(join(dir, "_chunks"), { recursive: true });
  writeFileSync(
    renderer,
    `var viteServices = { ["ssr"]: lazyService(() => import("../_ssr/ssr.mjs").then((n) => n.u)) };\n`,
  );
  for (const file of [ssr, renderer]) {
    const next = patchSsrSource(readFileSync(file, "utf8"));
    assert.ok(next, file);
    writeFileSync(file, next);
  }
  assert.equal(existsSync(ssr), true);
  const patchedSsr = readFileSync(ssr, "utf8");
  const patchedRenderer = readFileSync(renderer, "utf8");
  assert.match(patchedSsr, /server_default as u/);
  assert.match(patchedRenderer, /import\("\.\.\/_ssr\/ssr\.mjs"\)/);
  assert.doesNotMatch(patchedRenderer, /n\.u/);
});
