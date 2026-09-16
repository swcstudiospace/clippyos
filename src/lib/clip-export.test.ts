import assert from "node:assert/strict";
import { test } from "node:test";
import { clipExternalRef } from "./clip-export.ts";

test("clipExternalRef is stable and namespaced", () => {
  assert.equal(clipExternalRef("proj_123"), "crayo:project:proj_123");
  assert.equal(clipExternalRef(" proj_123 "), "crayo:project:proj_123");
});
