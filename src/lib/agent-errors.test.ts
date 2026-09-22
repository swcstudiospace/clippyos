import assert from "node:assert/strict";
import { test } from "node:test";
import { explainAgentToolError, isFatalAgentToolError } from "./agent.ts";

test("MISSING is fatal and points at Settings → Integrations → Crayo.ai", () => {
  assert.equal(isFatalAgentToolError("MISSING"), true);
  assert.match(explainAgentToolError("MISSING"), /Settings → Integrations → Crayo\.ai/);
});

test("unknown codes pass through without looking like success", () => {
  assert.equal(isFatalAgentToolError("SOME_NEW_CODE"), false);
  assert.equal(explainAgentToolError("SOME_NEW_CODE"), "SOME_NEW_CODE");
});

test("CLIENT_REQUIRED is fatal and points at the Client selector, not Crayo cards", () => {
  assert.equal(isFatalAgentToolError("CLIENT_REQUIRED"), true);
  assert.match(explainAgentToolError("CLIENT_REQUIRED"), /pinned client/);
  assert.doesNotMatch(explainAgentToolError("CLIENT_REQUIRED"), /\/short|voice_id/);
});
