import assert from "node:assert/strict";
import { test } from "node:test";
import { explainAgentToolError, isFatalAgentToolError } from "./agent.ts";

test("MISSING is fatal and explains the Vercel deploy gap", () => {
  assert.equal(isFatalAgentToolError("MISSING"), true);
  assert.match(explainAgentToolError("MISSING"), /next deploy/);
});

test("unknown codes pass through without looking like success", () => {
  assert.equal(isFatalAgentToolError("SOME_NEW_CODE"), false);
  assert.equal(explainAgentToolError("SOME_NEW_CODE"), "SOME_NEW_CODE");
});
