#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `ops.connect.${Date.now()}@agency.test`;
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

function flags(body) {
  return {
    connectHeading: /Connect Hermes/i.test(body),
    addons: /Add-ons/i.test(body),
    usedBy: /Used by:/i.test(body),
    browserRuntime: /Browser runtime/i.test(body),
    eventBus: /Event bus/i.test(body),
    mintKey: /Create Hermes key|Mint another Hermes key/i.test(body),
    playbookPackage: /Copy Playbook package for Hermes/i.test(body),
    autoStart: /social\.auto_start_for_upload/i.test(body),
    costCopy: /Daytona compute cost/i.test(body),
    outbound: /Outbound events to Hermes/i.test(body),
    uploadSucceeded: /social\.upload\.succeeded|Social upload succeeded/i.test(body),
    needsLogin: /social\.session\.needs_login|Social session needs login/i.test(body),
    reactor: /Reactor — upload succeeded|reactor_upload_succeeded/i.test(body),
    osFraming: /Autonomous OS/i.test(body),
  };
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Connect QA");
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
  await page.getByRole("heading", { name: "Connect Hermes" }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(600);
  const settingsBody = await page.locator("body").innerText();
  const settingsFlags = flags(settingsBody);
  notes.push({ settingsFlags });
  await shot("qa-hermes-connect-settings.png");

  for (const [key, ok] of Object.entries(settingsFlags)) {
    if (!ok) notes.push({ missing: key });
  }
  if (!settingsFlags.connectHeading || !settingsFlags.mintKey || !settingsFlags.playbookPackage) {
    throw new Error("Connect Hermes checklist is missing required surfaces");
  }
  if (!settingsFlags.autoStart || !settingsFlags.costCopy) {
    throw new Error("Social VM policy copy is missing");
  }
  if (!settingsFlags.addons || !settingsFlags.usedBy) {
    throw new Error("Add-ons framing is missing");
  }

  const mintBtn = page.getByRole("button", { name: /Create Hermes key|Mint another Hermes key/i });
  await mintBtn.click();
  await page.getByRole("heading", { name: /Hermes Agent API key/i }).waitFor({ timeout: 15000 });
  const apiKey = (await page.locator('[role="dialog"] code').first().innerText()).trim();
  notes.push({ apiKeyPrefix: apiKey.slice(0, 12), apiKeyLen: apiKey.length, hasAgk: apiKey.startsWith("agk_") });
  await page.getByRole("button", { name: "I’ve saved it" }).click();

  await page.getByRole("button", { name: "Copy Playbook package for Hermes" }).first().click();
  await page.waitForTimeout(400);
  const afterCopy = await page.locator("body").innerText();
  notes.push({
    pastedMarked: /Pasted into Hermes|I’ve pasted this into Hermes/i.test(afterCopy),
  });

  const confirm = page.getByRole("button", { name: /Confirm policy/i });
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
    await page.waitForTimeout(400);
  }

  const dashboard = page.getByRole("link", { name: "Dashboard" }).first();
  await dashboard.click();
  await page.waitForTimeout(800);
  const dashBody = await page.locator("body").innerText();
  notes.push({
    widget: /Hermes: Key only|Hermes: Fully connected|Hermes: Not connected/i.test(dashBody),
    keyOnly: /Key only/i.test(dashBody),
  });
  await shot("qa-hermes-connect-dashboard.png");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.setDefaultTimeout(30000);
  await mobile.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
  // already signed in via cookies? new context is clean — skip, use same storage
  await mobile.close();

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  // copy storage from first page
  const storage = await page.context().storageState();
  await mobilePage.context().addCookies(storage.cookies ?? []);
  await mobilePage.goto(`${base}/settings`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1200);
  await mobilePage.screenshot({
    path: "/workspace/screenshots/qa-hermes-connect-mobile.png",
    fullPage: true,
  });
  notes.push("saved qa-hermes-connect-mobile.png");
  await mobilePage.close();

  if (apiKey) {
    const statusRes = await fetch(`${base}/api/v1/automation/connect-status`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const statusJson = await statusRes.json();
    notes.push({
      connectStatusHttp: statusRes.status,
      hasHermesKey: statusJson?.data?.hasHermesKey,
      version: statusJson?.data?.playbookPackageVersion,
      autoStart: statusJson?.data?.policies?.socialAutoStartForUpload,
    });
    const pkgRes = await fetch(`${base}/api/v1/automation/playbook-package`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const pkgJson = await pkgRes.json();
    const text = String(pkgJson?.data?.text ?? "");
    notes.push({
      packageHttp: pkgRes.status,
      packageVersion: pkgJson?.data?.version,
      hasPlaceholder: text.includes("<API_KEY>"),
      hasReactor: /reactor_upload_succeeded/.test(text),
      hasNoRawKey: !text.includes(apiKey),
      hasAutoStartDefault: /social\.auto_start_for_upload: false/.test(text),
    });
    if (statusRes.status !== 200) throw new Error("connect-status failed");
    if (pkgRes.status !== 200) throw new Error("playbook-package failed");
    if (text.includes(apiKey)) throw new Error("Playbook package leaked API key");
  }

  writeFileSync(
    "/workspace/screenshots/qa-hermes-connect.json",
    JSON.stringify({ ok: errors.length === 0, notes, errors }, null, 2),
  );
  if (errors.length) {
    console.error(JSON.stringify({ ok: false, notes, errors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, notes }, null, 2));
} catch (error) {
  await shot("qa-hermes-connect-error.png").catch(() => {});
  const body = await page.locator("body").innerText().catch(() => "");
  writeFileSync(
    "/workspace/screenshots/qa-hermes-connect.json",
    JSON.stringify({ ok: false, error: String(error), body: body.slice(0, 4000), notes, errors }, null, 2),
  );
  console.error(String(error));
  process.exit(1);
} finally {
  await browser.close();
}
