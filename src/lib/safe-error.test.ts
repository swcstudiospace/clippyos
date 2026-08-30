import assert from "node:assert/strict";
import { test } from "node:test";
import { publicErrorCode } from "./safe-error.ts";

test("publicErrorCode keeps UPPER_SNAKE codes and drops stacks/paths", () => {
  assert.equal(publicErrorCode(new Error("UNAUTHORIZED")), "UNAUTHORIZED");
  assert.equal(publicErrorCode(new Error("DEMO_RATE_LIMIT")), "DEMO_RATE_LIMIT");
  assert.equal(publicErrorCode(new Error("Couldn’t create sandbox at /tmp/x")), "DATA_UNAVAILABLE");
  assert.equal(publicErrorCode(new Error("UNAUTHORIZED\n    at foo.ts:1")), "UNAUTHORIZED");
  assert.equal(publicErrorCode("not-a-code"), "DATA_UNAVAILABLE");
  assert.equal(publicErrorCode(new Error("x".repeat(80))), "DATA_UNAVAILABLE");
});
