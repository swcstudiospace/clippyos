/**
 * Loaded via `node --import` before the test runner starts. Registers the `@/*` alias resolve
 * hook (test-alias-hook.mjs) so `.server.ts` unit tests can import modules that use the app's
 * `@/...` import alias, which only Vite/tsc understand natively.
 */
import { register } from "node:module";

register("./test-alias-hook.mjs", import.meta.url);
