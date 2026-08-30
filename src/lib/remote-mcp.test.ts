import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_MCP_PRESET,
  MCP_DENIED_TOOLS,
  MCP_SCOPE_PRESETS,
  REMOTE_MCP_TOOLS,
  canonicalizeMcpArgs,
  formatClippyOsMcpConnectorJson,
  hermesScopesFromMcp,
  hasMcpScope,
  isMcpScope,
  mapRemoteToolCall,
  parseMcpScopes,
  redactMcpArgs,
  remoteToolAllowed,
  scopesForPreset,
  shapeRemoteMcpResult,
  uniqueMcpScopes,
} from "./remote-mcp.ts";

test("pilot preset is read-only ops plus social:write", () => {
  const scopes = scopesForPreset(DEFAULT_MCP_PRESET);
  assert.equal(scopes.includes("clients:read"), true);
  assert.equal(scopes.includes("social:write"), true);
  assert.equal(scopes.includes("admin:mcp"), false);
  assert.equal(scopes.includes("agent:write"), false);
});

test("full connector never includes admin:mcp", () => {
  assert.equal(MCP_SCOPE_PRESETS["full-connector"].includes("admin:mcp"), false);
  assert.equal(uniqueMcpScopes(["admin:mcp", "clients:read"]).includes("admin:mcp"), false);
  assert.equal(uniqueMcpScopes(["clients:read"]).includes("mcp:discover"), true);
});

test("parseMcpScopes ignores Hermes and unknown scopes", () => {
  assert.deepEqual(parseMcpScopes(["clients:read", "read", "nope", "social:write"]), [
    "clients:read",
    "social:write",
  ]);
  assert.deepEqual(parseMcpScopes('["library:read"]'), ["library:read"]);
  assert.deepEqual(parseMcpScopes("not-json"), []);
});

test("tools/list filter hides write tools from read-only scopes", () => {
  const read = MCP_SCOPE_PRESETS["readonly-ops"];
  const visible = REMOTE_MCP_TOOLS.filter((tool) => remoteToolAllowed(tool, read)).map((tool) => tool.name);
  assert.equal(visible.includes("clients_list"), true);
  assert.equal(visible.includes("social_create_upload_job"), false);
  assert.equal(visible.includes("approvals_decide"), false);
  assert.equal(visible.includes("agent_start_run"), false);
  assert.equal(visible.includes("crayo_run_short"), false);
  assert.equal(visible.includes("grokbot_claim_work"), false);
  assert.equal(hasMcpScope(read, "mcp:discover"), true);
});

test("publisher preset can create upload jobs and grokbot claim", () => {
  const scopes = scopesForPreset("publisher");
  const create = REMOTE_MCP_TOOLS.find((tool) => tool.name === "social_create_upload_job");
  const claim = REMOTE_MCP_TOOLS.find((tool) => tool.name === "grokbot_claim_work");
  assert.ok(create && remoteToolAllowed(create, scopes));
  assert.ok(claim && remoteToolAllowed(claim, scopes));
});

test("denied Hermes tools are not in the remote catalog", () => {
  const names = new Set(REMOTE_MCP_TOOLS.map((tool) => tool.name));
  const actions = new Set(REMOTE_MCP_TOOLS.map((tool) => tool.action));
  for (const denied of MCP_DENIED_TOOLS) {
    assert.equal(names.has(denied), false);
    assert.equal(actions.has(denied), false);
  }
  assert.equal(isMcpScope("write:payments"), false);
});

test("readonly-ops can read health but cannot retry jobs", () => {
  const read = MCP_SCOPE_PRESETS["readonly-ops"];
  const summary = REMOTE_MCP_TOOLS.find((tool) => tool.name === "health_get_summary");
  const list = REMOTE_MCP_TOOLS.find((tool) => tool.name === "health_list_jobs");
  const retry = REMOTE_MCP_TOOLS.find((tool) => tool.name === "health_retry_job");
  assert.ok(summary && remoteToolAllowed(summary, read));
  assert.ok(list && remoteToolAllowed(list, read));
  assert.ok(retry && !remoteToolAllowed(retry, read));
  const mapped = mapRemoteToolCall("health_retry_job", { id: "j1", type: "SOCIAL_UPLOAD" });
  assert.equal(mapped?.action, "health.retry_job");
});

test("mapRemoteToolCall remaps ids and approval decisions", () => {
  assert.equal(mapRemoteToolCall("nope", {}), null);
  const get = mapRemoteToolCall("clients_get", { clientId: "c1" });
  assert.equal(get?.action, "get_client");
  assert.equal(get?.payload.id, "c1");
  const decide = mapRemoteToolCall("approvals_decide", { approvalId: "a1", decision: "APPROVE" });
  assert.equal(decide?.action, "approvals.decide");
  assert.equal(decide?.payload.id, "a1");
  assert.equal(decide?.payload.decision, "APPROVED");
  const job = mapRemoteToolCall("social_get_upload_job", { jobId: "j1" });
  assert.equal(job?.payload.id, "j1");
  const list = mapRemoteToolCall("clients_list", { query: "acme" });
  assert.equal(list?.payload.search, "acme");
});

test("shapeRemoteMcpResult strips team cost internals", () => {
  const listed = shapeRemoteMcpResult("clients_list", {
    clients: [
      {
        id: "c1",
        name: "Acme",
        planType: "GROWTH",
        currentStage: "EDITING",
        channelUrl: "https://youtube.com/@acme",
        monthlyFee: 5000,
        setupFee: 1000,
      },
    ],
  }) as Array<Record<string, unknown>>;
  assert.equal(listed[0]?.monthlyFee, undefined);
  assert.equal(listed[0]?.setupFee, undefined);
  assert.equal(listed[0]?.stage, "EDITING");
  const one = shapeRemoteMcpResult("clients_get", {
    id: "c1",
    name: "Acme",
    monthlyFee: 5000,
    currentStage: "FILMING",
  }) as Record<string, unknown>;
  assert.equal(one.monthlyFee, undefined);
  assert.equal(one.stage, "FILMING");
});

test("redactMcpArgs never keeps secrets in the digest payload", () => {
  const redacted = redactMcpArgs({
    caption: "hello",
    token: "super-secret",
    nested: { apiKey: "abc", ok: true },
  }) as Record<string, unknown>;
  assert.equal(redacted.token, "[redacted]");
  assert.equal((redacted.nested as Record<string, unknown>).apiKey, "[redacted]");
  assert.equal(redacted.caption, "hello");
  const a = canonicalizeMcpArgs({ b: 1, a: 2, token: "x" });
  const b = canonicalizeMcpArgs({ a: 2, b: 1, token: "y" });
  assert.equal(a, b);
  assert.equal(a.includes("x") || a.includes("y"), false);
});

test("connector JSON is Grok Bot compatible", () => {
  const json = formatClippyOsMcpConnectorJson("https://os.swcstudio.space/api/mcp", "cos_mcp_test");
  assert.equal(json.includes("https://os.swcstudio.space/api/mcp"), true);
  assert.equal(json.includes("Bearer cos_mcp_test"), true);
  assert.equal(json.includes("\"type\": \"custom\""), true);
});

test("MCP scopes map to Hermes scopes without payments or skill_manage", () => {
  const mapped = hermesScopesFromMcp(scopesForPreset("full-connector"));
  assert.equal(mapped.includes("read"), true);
  assert.equal(mapped.includes("write:social"), true);
  assert.equal(mapped.includes("approvals:admin"), true);
  assert.equal(mapped.includes("write:payments"), false);
  assert.equal(mapped.includes("skills:manage"), false);
});
