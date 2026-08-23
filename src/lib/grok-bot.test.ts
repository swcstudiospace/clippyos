import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveGrokBotConnection,
  formatGrokBotConnectorJson,
  grokBotConnectionTone,
  grokBotHeartbeatFresh,
  grokBotOperatorBrief,
} from "./grok-bot.ts";


test("heartbeat is fresh for 15 minutes", () => {
  const now = Date.parse("2026-08-23T00:15:00.000Z");
  assert.equal(grokBotHeartbeatFresh("2026-08-23T00:05:00.000Z", now), true);
  assert.equal(grokBotHeartbeatFresh("2026-08-22T23:50:00.000Z", now), false);
  assert.equal(grokBotHeartbeatFresh(null, now), false);
});

test("connection states: key → waiting → online → working", () => {
  assert.equal(
    deriveGrokBotConnection({ hasKey: false, pastedConnectorAt: null, lastHeartbeatAt: null, claimed: 0 }),
    "not_connected",
  );
  assert.equal(
    deriveGrokBotConnection({ hasKey: true, pastedConnectorAt: null, lastHeartbeatAt: null, claimed: 0 }),
    "key_only",
  );
  assert.equal(
    deriveGrokBotConnection({
      hasKey: true,
      pastedConnectorAt: "2026-08-23T00:00:00.000Z",
      lastHeartbeatAt: null,
      claimed: 0,
    }),
    "waiting",
  );
  const fresh = new Date().toISOString();
  assert.equal(
    deriveGrokBotConnection({
      hasKey: true,
      pastedConnectorAt: fresh,
      lastHeartbeatAt: fresh,
      claimed: 0,
    }),
    "online",
  );
  assert.equal(
    deriveGrokBotConnection({
      hasKey: true,
      pastedConnectorAt: fresh,
      lastHeartbeatAt: fresh,
      claimed: 1,
    }),
    "working",
  );
});

test("connector JSON and operator brief mention MCP URL", () => {
  const json = formatGrokBotConnectorJson("https://os.swcstudio.space/api/mcp");
  assert.equal(json.includes("https://os.swcstudio.space/api/mcp"), true);
  assert.equal(json.includes("Bearer <GROK_BOT_MCP_TOKEN>"), true);
  const brief = grokBotOperatorBrief({
    origin: "https://os.swcstudio.space",
    mcpUrl: "https://os.swcstudio.space/api/mcp",
    botName: "ClippyOS Operator",
  });
  assert.equal(brief.includes("grokbot.list_work"), true);
  assert.equal(brief.includes("Never start or stop the Daytona"), true);
});

test("connection tone maps states", () => {
  assert.equal(grokBotConnectionTone("not_connected"), "neutral");
  assert.equal(grokBotConnectionTone("key_only"), "blue");
  assert.equal(grokBotConnectionTone("waiting"), "orange");
  assert.equal(grokBotConnectionTone("online"), "green");
  assert.equal(grokBotConnectionTone("working"), "purple");
});

