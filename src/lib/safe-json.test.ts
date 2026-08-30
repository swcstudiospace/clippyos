import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_JSON_BODY_BYTES, parseJsonObject } from "./safe-json.ts";

test("parseJsonObject accepts objects and rejects arrays, junk, and oversized bodies", () => {
  assert.deepEqual(parseJsonObject('{"a":1}'), { a: 1 });
  assert.deepEqual(parseJsonObject(""), {});
  assert.throws(() => parseJsonObject("[1]"), /VALIDATION/);
  assert.throws(() => parseJsonObject("nope"), /VALIDATION/);
  assert.throws(() => parseJsonObject("x".repeat(MAX_JSON_BODY_BYTES + 1)), /VALIDATION/);
});
