import assert from "node:assert/strict";
import { test } from "node:test";
import { shellEnvAssignment } from "./sandbox.ts";

test("shellEnvAssignment drops unsafe keys and metacharacters", () => {
  assert.equal(shellEnvAssignment("SKILL_ID", "abc_1"), "SKILL_ID='abc_1'");
  assert.equal(shellEnvAssignment("not_ok", "x"), null);
  assert.equal(shellEnvAssignment("PATH", "a;b"), null);
  assert.equal(shellEnvAssignment("PATH", "a`b"), null);
  assert.equal(shellEnvAssignment("PATH", "a\nb"), null);
});
