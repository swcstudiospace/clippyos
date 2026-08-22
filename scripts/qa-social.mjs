#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `ops.social.${Date.now()}@agency.test`;
const password = "password123";
const daytonaKey = process.env.DAYTONA_QA_KEY || "";
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

async function dismissWelcome() {
  const skip = page.getByRole("button", { name: /Skip for now|I’ll do this later/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  const closeDlg = page.getByRole("button", { name: "Close" });
  if (await closeDlg.isVisible().catch(() => false)) await closeDlg.click();
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Social QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.waitForTimeout(800);
  await dismissWelcome();
  await shot("qa-social-dashboard.png");

  const dashBody = await page.locator("body").innerText();
  notes.push({
    dashboardHasStart: /Start Social Machine/i.test(dashBody),
    dashboardAutoStarted: /Social Machine[\s\S]{0,80}Running/i.test(dashBody),
  });
  if (/Start Social Machine/i.test(dashBody) && page.url().endsWith("/")) {
    errors.push("Dashboard unexpectedly shows Social Machine start control");
  }

  await page.getByRole("link", { name: "Social", exact: true }).click();
  await page.waitForURL(/\/social/, { timeout: 15000 });
  await page.getByRole("heading", { name: "Social", exact: true }).waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Start Social Machine" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(400);
  const socialBody = await page.locator("body").innerText();
  notes.push({
    hasMachine: /Social Machine/i.test(socialBody),
    hasStart: /Start Social Machine/i.test(socialBody),
    hasStop: /\bStop\b/i.test(socialBody),
    hasIdleNote: /stays off until you start it/i.test(socialBody),
    hasInstagram: /Instagram/i.test(socialBody),
    hasX: /\bX\b/.test(socialBody),
    hasTikTok: /TikTok/i.test(socialBody),
    hasUpload: /1-click upload/i.test(socialBody),
    startDisabled: await page.getByRole("button", { name: "Start Social Machine" }).isDisabled(),
    machineRunningOnLoad: /Running/.test(socialBody) && !/Not configured|Stopped/.test(socialBody),
  });
  await shot("qa-social-tab.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await shot("qa-social-mobile.png");
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("heading", { name: "Integrations" }).waitFor({ timeout: 20000 });
  const settingsBody = await page.locator("body").innerText();
  notes.push({
    hasDaytonaCard: /Daytona \(Computer Use \/ Social\)/i.test(settingsBody),
    hasTest: /Test/i.test(settingsBody),
  });
  await shot("qa-social-integrations.png");

  if (daytonaKey) {
    const keyInput = page.locator("#dtn-key");
    await keyInput.waitFor({ timeout: 10000 });
    await keyInput.fill(daytonaKey);
    const urlInput = page.locator("#dtn-url");
    if (await urlInput.count()) await urlInput.fill("https://app.daytona.io/api");
    const stopInput = page.locator("#dtn-stop");
    if (await stopInput.count()) await stopInput.fill("20");
    await page
      .locator(".glass-card")
      .filter({ hasText: "Daytona (Computer Use / Social)" })
      .getByRole("button", { name: "Save" })
      .click();
    await page.getByText("Daytona (Computer Use / Social) saved").waitFor({ timeout: 15000 }).catch(() => undefined);
    await page.waitForTimeout(800);

    await page
      .locator(".glass-card")
      .filter({ hasText: "Daytona (Computer Use / Social)" })
      .getByRole("button", { name: /^Test$/ })
      .click();
    await page.waitForTimeout(12000);
    const afterTest = await page.locator("body").innerText();
    notes.push({
      testResult: /Connected|rejected|Couldn’t|Could not/i.test(afterTest),
      afterTestSnippet: afterTest.slice(afterTest.indexOf("Daytona"), afterTest.indexOf("Daytona") + 500),
    });
    await shot("qa-social-integrations-saved.png");
  } else {
    notes.push({ skippedKeySave: true });
  }

  await page.getByRole("link", { name: "Social", exact: true }).click();
  await page.waitForURL(/\/social/, { timeout: 15000 });
  await page.getByRole("button", { name: "Start Social Machine" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(500);
  const afterSave = await page.locator("body").innerText();
  notes.push({
    stillOff: /Stopped|Not configured/i.test(afterSave),
    notRunningAfterTest: !/Social Machine[\s\S]{0,40}Running/i.test(afterSave) || /Stopped/i.test(afterSave),
    startEnabled: !(await page.getByRole("button", { name: "Start Social Machine" }).isDisabled()),
  });
  await shot("qa-social-after-save.png");

  writeFileSync(
    "/workspace/screenshots/qa-social.json",
    JSON.stringify({ notes, errors, email }, null, 2),
  );
  if (errors.length) {
    console.error(JSON.stringify({ errors, notes }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ ok: true, notes }, null, 2));
  }
} catch (error) {
  await shot("qa-social-error.png").catch(() => undefined);
  console.error(error);
  writeFileSync(
    "/workspace/screenshots/qa-social.json",
    JSON.stringify({ error: String(error), notes, errors }, null, 2),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
