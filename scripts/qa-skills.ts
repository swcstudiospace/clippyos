#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `ops.skills.${Date.now()}@agency.test`;
const password = "password123";
const notes = [];
const errors: string[] = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);
page.on("pageerror", (err) => errors.push(String(err)));

async function shot(name: string) {
  await page.screenshot({ path: `/workspace/screenshots/${name}`, fullPage: true });
  notes.push(`saved ${name}`);
  console.log("saved", name);
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Skills QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.waitForTimeout(800);
  const skip = page.getByRole("button", { name: /Skip for now|I’ll do this later/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  const closeDlg = page.getByRole("button", { name: "Close" });
  if (await closeDlg.isVisible().catch(() => false)) await closeDlg.click();

  await page.goto(`${base}/settings`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "LLM Providers" }).waitFor({ timeout: 30000 });
  await page.getByRole("heading", { name: "Daily ops brief" }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(400);
  const body = await page.locator("body").innerText();
  const flags = {
    llmHeading: /LLM Providers/i.test(body),
    grok46: /Grok 4\.6/i.test(body),
    superGrok: /Connect SuperGrok|SuperGrok/i.test(body),
    metered: /xAI API \(metered\)/i.test(body),
    tierHonesty: /403|tier cannot run inference|metered xAI API key/i.test(body),
    skillsHeading: /\bSkills\b/.test(body),
    dailyOps: /Daily ops brief/i.test(body),
    caption: /Caption from titles/i.test(body),
    pendingCopy: /pending_review|pending review/i.test(body),
    addonsRegistry: /Add-on registry/i.test(body),
    skillsRuntime: /Skills runtime/i.test(body),
    hermesLocked: /Hermes control plane/i.test(body),
    mcpSkills: /skills\.list|skills\/list/i.test(body),
  };
  notes.push({ flags });
  await shot("qa-skills-settings.png");
  for (const [key, ok] of Object.entries(flags)) {
    if (!ok) notes.push({ missing: key });
  }
  if (!flags.llmHeading || !flags.grok46 || !flags.skillsHeading || !flags.addonsRegistry) {
    throw new Error("Settings is missing Skills / LLM / Add-on surfaces");
  }
  if (!flags.dailyOps) throw new Error("Builtin skills did not appear");

  await page.getByRole("button", { name: /Create Hermes key|Mint another Hermes key/i }).click();
  await page.getByRole("heading", { name: /Hermes Agent API key/i }).waitFor({ timeout: 15000 });
  const apiKey = (await page.locator('[role="dialog"] code').first().innerText()).trim();
  notes.push({ apiKeyPrefix: apiKey.slice(0, 12), hasAgk: apiKey.startsWith("agk_") });
  await page.getByRole("button", { name: "I’ve saved it" }).click();

  const mcpDiscovery = await fetch(`${base}/api/mcp`);
  const mcpJson = await mcpDiscovery.json();
  notes.push({
    mcpHttp: mcpDiscovery.status,
    hasSkillsCap: Boolean(mcpJson?.capabilities?.skills),
    listChanged: Boolean(mcpJson?.capabilities?.tools?.listChanged),
  });
  if (mcpDiscovery.status !== 200 || !mcpJson?.capabilities?.skills) {
    throw new Error("MCP discovery is missing skills capability");
  }

  const skillsRes = await fetch(`${base}/api/v1/skills`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const skillsJson = await skillsRes.json();
  const listed = skillsJson?.data?.skills ?? [];
  notes.push({
    skillsHttp: skillsRes.status,
    skillCount: listed.length,
    slugs: listed.map((row: { slug?: string }) => row.slug),
  });
  if (skillsRes.status !== 200) throw new Error("GET /api/v1/skills failed");
  if (!listed.some((row: { slug?: string }) => row.slug === "daily-ops-brief")) {
    throw new Error("daily-ops-brief missing from skills/list");
  }

  const invokeRes = await fetch(`${base}/api/v1/skills/daily-ops-brief/invoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const invokeJson = await invokeRes.json();
  notes.push({
    invokeHttp: invokeRes.status,
    taskId: invokeJson?.data?.taskId,
    runStatus: invokeJson?.data?.run?.status,
  });
  if (invokeRes.status !== 200) throw new Error("skills.invoke failed");
  if (!invokeJson?.data?.taskId) throw new Error("invoke did not return a task id");

  const taskRes = await fetch(`${base}/api/v1/tasks/${invokeJson.data.taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const taskJson = await taskRes.json();
  notes.push({ taskHttp: taskRes.status, taskStatus: taskJson?.data?.task?.status ?? taskJson?.data?.status });
  if (taskRes.status !== 200) throw new Error("tasks/get failed");

  const addonsRes = await fetch(`${base}/api/v1/addons`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const addonsJson = await addonsRes.json();
  const addonIds = (addonsJson?.data?.addons ?? []).map((row: { id?: string }) => row.id);
  notes.push({ addonsHttp: addonsRes.status, addonIds });
  if (addonsRes.status !== 200) throw new Error("GET /api/v1/addons failed");
  if (!addonIds.includes("agency.skills-runtime") || !addonIds.includes("agency.hermes-control-plane")) {
    throw new Error("Built-in add-ons missing");
  }

  const llmRes = await fetch(`${base}/api/v1/llm/providers`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const llmJson = await llmRes.json();
  notes.push({
    llmHttp: llmRes.status,
    defaultModel: llmJson?.data?.router?.defaultModel,
    catalog: llmJson?.data?.catalog?.map((row: { id?: string }) => row.id),
  });
  if (llmRes.status !== 200) throw new Error("GET /api/v1/llm/providers failed");
  if (llmJson?.data?.router?.defaultModel !== "grok-4.6") {
    throw new Error("Default model is not grok-4.6");
  }

  const pkgRes = await fetch(`${base}/api/v1/automation/playbook-package`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const pkgJson = await pkgRes.json();
  const text = String(pkgJson?.data?.text ?? "");
  notes.push({
    packageHttp: pkgRes.status,
    hasSkillsPolicy: /skills\.auto_publish_agent: false/.test(text),
    hasGrok: /grok-4\.6/.test(text),
    hasExecute: /skills:execute/.test(text),
    hasManageExcluded: /skills:manage/.test(text),
    hasNoRawKey: !text.includes(apiKey),
    hasDaily: /daily-ops-brief/.test(text),
  });
  if (!/skills\.auto_publish_agent: false/.test(text)) throw new Error("Playbook missing skills policy");
  if (!/grok-4\.6/.test(text)) throw new Error("Playbook missing grok-4.6");
  if (text.includes(apiKey)) throw new Error("Playbook leaked API key");

  const createDenied = await fetch(`${base}/api/v1/skills`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillMd: "---\nname: Should fail\n---\nNo manage scope" }),
  });
  notes.push({ createStatus: createDenied.status });
  if (createDenied.status !== 403) {
    throw new Error("Hermes key should not have skills:manage");
  }

  await page.getByRole("heading", { name: "Daily ops brief" }).click();
  await page.getByRole("heading", { name: "Daily ops brief" }).nth(1).waitFor({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
  await shot("qa-skills-detail.png");

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const storage = await page.context().storageState();
  await mobilePage.context().addCookies(storage.cookies ?? []);
  await mobilePage.goto(`${base}/settings`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1200);
  await mobilePage.screenshot({
    path: "/workspace/screenshots/qa-skills-mobile.png",
    fullPage: true,
  });
  notes.push("saved qa-skills-mobile.png");
  await mobilePage.close();

  writeFileSync(
    "/workspace/screenshots/qa-skills.json",
    JSON.stringify({ ok: errors.length === 0, notes, errors }, null, 2),
  );
  if (errors.length) {
    console.error(JSON.stringify({ ok: false, notes, errors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, notes }, null, 2));
} catch (error) {
  await shot("qa-skills-error.png").catch(() => {});
  const body = await page.locator("body").innerText().catch(() => "");
  writeFileSync(
    "/workspace/screenshots/qa-skills.json",
    JSON.stringify({ ok: false, error: String(error), body: body.slice(0, 4000), notes, errors }, null, 2),
  );
  console.error(String(error));
  process.exit(1);
} finally {
  await browser.close();
}
