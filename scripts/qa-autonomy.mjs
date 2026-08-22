#!/usr/bin/env node
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `ops.auto.${Date.now()}@agency.test`;
const password = "password123";
const notes = [];
const errors = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);
page.on("pageerror", (err) => errors.push(String(err)));

async function shot(name) {
  await page.screenshot({ path: `/workspace/screenshots/${name}`, fullPage: true });
  notes.push(`saved ${name}`);
  console.log("saved", name);
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Ops QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.waitForTimeout(800);
  const skip = page.getByRole("button", { name: /Skip for now|I’ll do this later/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  const closeDlg = page.getByRole("button", { name: "Close" });
  if (await closeDlg.isVisible().catch(() => false)) await closeDlg.click();

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("heading", { name: "Automation & Hermes" }).waitFor({ timeout: 20000 });
  const createKeyBtn = page.getByRole("button", { name: "Create API key" });
  try {
    await createKeyBtn.waitFor({ timeout: 15000 });
  } catch {
    notes.push({ bodySnippet: (await page.locator("body").innerText()).slice(0, 1500) });
    throw new Error("Automation panel is not admin-writable for this operator");
  }
  const body = await page.locator("body").innerText();
  notes.push({
    hasIntro: /paste them into Hermes/i.test(body),
    hasApi: /API access/i.test(body),
    hasMcp: /MCP server/i.test(body),
    hasWebhooks: /Inbound webhook URL/i.test(body),
    hasAudit: /Agent activity/i.test(body),
    hasHumanOnly: /Human-only boundary/i.test(body),
    hasPlaybook: /Hermes Playbook/i.test(body) && /Copy playbook summary for Hermes/i.test(body),
    hasKillSwitch: /Kill switch/i.test(body),
    playbookCount: (body.match(/daily_ops_brief|Daily ops brief/g) || []).length,
    adminUi: /Create API key/i.test(body),
  });
  await shot("qa-autonomy-settings.png");

  if (!/Create API key/i.test(body)) {
    throw new Error("Automation panel is not admin-writable for this operator");
  }

  await page.getByRole("button", { name: "Create API key" }).click();
  await page.getByRole("heading", { name: "API key" }).waitFor();
  const apiKey = (await page.locator('[role="dialog"] code').first().innerText()).trim();
  notes.push({ apiKeyPrefix: apiKey.slice(0, 12), apiKeyLen: apiKey.length });
  await page.getByRole("button", { name: "I’ve saved it" }).click();

  await page.getByRole("button", { name: /Generate MCP token|Rotate MCP token/ }).click();
  await page.getByRole("heading", { name: "MCP token" }).waitFor();
  const mcpToken = (await page.locator('[role="dialog"] code').first().innerText()).trim();
  notes.push({ mcpPrefix: mcpToken.slice(0, 8), mcpLen: mcpToken.length });
  await page.getByRole("button", { name: "I’ve saved it" }).click();

  await page.getByRole("button", { name: /Generate signing secret|Rotate signing secret/ }).click();
  await page.getByRole("heading", { name: "Webhook signing secret" }).waitFor();
  const whsec = (await page.locator('[role="dialog"] code').first().innerText()).trim();
  notes.push({ whPrefix: whsec.slice(0, 8), whLen: whsec.length });
  await page.getByRole("button", { name: "I’ve saved it" }).click();
  await shot("qa-autonomy-after-keys.png");

  const unauth = await fetch(`${base}/api/v1/clients`);
  notes.push({ unauthStatus: unauth.status });

  const nestedUnauth = await fetch(`${base}/api/v1/clients/does-not-exist/progress`);
  notes.push({ nestedUnauth: nestedUnauth.status });

  const listRes = await fetch(`${base}/api/v1/clients`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const listJson = await listRes.json();
  notes.push({ listStatus: listRes.status, hasClients: Array.isArray(listJson?.data?.clients) });

  const dashRes = await fetch(`${base}/api/v1/dashboard`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const dashJson = await dashRes.json();
  notes.push({
    dashStatus: dashRes.status,
    hasMrr: typeof dashJson?.data?.metrics?.totalMrr === "number",
    hasPipeline: Boolean(dashJson?.data?.pipeline),
  });

  const integRes = await fetch(`${base}/api/v1/integrations/status`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const integJson = await integRes.json();
  const integBlob = JSON.stringify(integJson);
  notes.push({
    integStatus: integRes.status,
    leakedSecrets: /whsec_|agk_live_|sk-|xai-/.test(integBlob),
    values: integJson?.data,
  });

  const atRisk = await fetch(`${base}/api/v1/clients/at-risk`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const atRiskJson = await atRisk.json();
  notes.push({ atRiskStatus: atRisk.status, atRiskClients: Array.isArray(atRiskJson?.data?.clients) });

  const playbooks = await fetch(`${base}/api/v1/playbooks`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const playbooksJson = await playbooks.json();
  notes.push({
    playbooksStatus: playbooks.status,
    playbookCount: playbooksJson?.data?.playbooks?.length,
    autoMark: playbooksJson?.data?.policies?.autoMarkPayments,
  });

  const createLead = await fetch(`${base}/api/v1/leads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Hermes Lead", status: "TO_CONTACT", upfrontCash: 1000, monthlyRecurring: 500 }),
  });
  const leadJson = await createLead.json();
  notes.push({ createLead: createLead.status, leadId: leadJson?.data?.id });

  const mcpInit = await fetch(`${base}/api/mcp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${mcpToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
  });
  const mcpInitJson = await mcpInit.json();
  notes.push({ mcpInit: mcpInit.status, mcpName: mcpInitJson?.result?.serverInfo?.name });

  const mcpTools = await fetch(`${base}/api/mcp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${mcpToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
  });
  const mcpToolsJson = await mcpTools.json();
  notes.push({ mcpTools: mcpToolsJson?.result?.tools?.length });
  const socialTools = (mcpToolsJson?.result?.tools ?? []).filter((t) =>
    String(t.name ?? "").startsWith("social."),
  );
  notes.push({ socialMcpTools: socialTools.length });

  const socialStatus = await fetch(`${base}/api/v1/social/machine`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const socialStatusJson = await socialStatus.json();
  const socialBlob = JSON.stringify(socialStatusJson);
  notes.push({
    socialStatus: socialStatus.status,
    socialState: socialStatusJson?.data?.state,
    leakedDaytona: /dtn_|DAYTONA_API|novnc|6080/i.test(socialBlob),
    hasPreviewUrl: Boolean(socialStatusJson?.data?.previewUrl),
  });

  const uploadStopped = await fetch(`${base}/api/v1/social/jobs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: "missing",
      platforms: ["instagram"],
      caption: "test",
    }),
  });
  const uploadStoppedJson = await uploadStopped.json();
  notes.push({
    createJobStatus: uploadStopped.status,
    createJobCode: uploadStoppedJson?.error?.code,
  });

  const playbookIds = (playbooksJson?.data?.playbooks ?? []).map((row) => row.id);
  notes.push({
    hasSocialPlaybooks: [
      "social_machine_cost_guard",
      "distribute_published_client_asset",
      "emergency_stop_social_machine",
    ].every((id) => playbookIds.includes(id)),
    socialAutoStart: playbooksJson?.data?.policies?.socialAutoStartForUpload,
  });

  const mcpCall = await fetch(`${base}/api/mcp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${mcpToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "get_dashboard_snapshot", arguments: {} },
    }),
  });
  const mcpCallJson = await mcpCall.json();
  notes.push({ mcpCall: mcpCall.status, mcpHasContent: Boolean(mcpCallJson?.result?.content) });

  const badWh = await fetch(`${base}/api/webhooks/inbound`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Agency-Timestamp": String(Math.floor(Date.now() / 1000)), "X-Agency-Signature": "sha256=deadbeef" },
    body: JSON.stringify({ command: "create_lead", payload: { name: "Nope" } }),
  });
  notes.push({ badWebhook: badWh.status });

  const ts = String(Math.floor(Date.now() / 1000));
  const payload = JSON.stringify({
    id: `cmd_${Date.now()}`,
    command: "create_lead",
    payload: { name: "Signed Lead", status: "IN_TALKS", upfrontCash: 0, monthlyRecurring: 0 },
  });
  const sig = createHmac("sha256", whsec).update(`${ts}.${payload}`).digest("hex");
  const goodWh = await fetch(`${base}/api/webhooks/inbound`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Agency-Timestamp": ts,
      "X-Agency-Signature": `sha256=${sig}`,
    },
    body: payload,
  });
  const goodJson = await goodWh.json();
  notes.push({ goodWebhook: goodWh.status, signedLead: goodJson?.data?.name });

  const secretsLeak = JSON.stringify({ listJson, dashJson, mcpInitJson, integJson });
  notes.push({ leakedSecret: /whsec_|agk_live_|xai-|sk-/.test(secretsLeak) });

  await page.reload();
  await page.getByRole("heading", { name: "Automation & Hermes" }).waitFor();
  const after = await page.locator("body").innerText();
  notes.push({ auditVisible: /create_lead|list_clients|get_dashboard/i.test(after) });
  await shot("qa-autonomy-audit.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await shot("qa-autonomy-mobile.png");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Dashboard", exact: true }).first().click();
  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "", { timeout: 15000 });
  await page.getByRole("heading", { name: "Hermes", exact: true }).waitFor({ timeout: 15000 });
  await shot("qa-autonomy-dashboard.png");

  writeFileSync("/workspace/screenshots/qa-autonomy.json", JSON.stringify({ notes, errors }, null, 2));
  console.log(JSON.stringify({ notes, errors }, null, 2));
  if (unauth.status !== 401 || listRes.status !== 200 || mcpInit.status !== 200 || goodWh.status !== 200) {
    process.exitCode = 1;
  }
} catch (error) {
  await shot("qa-autonomy-error.png");
  console.error(error);
  writeFileSync("/workspace/screenshots/qa-autonomy.json", JSON.stringify({ notes, errors: [...errors, String(error)] }, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
