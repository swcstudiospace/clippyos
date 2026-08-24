#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `ops.mobile.${Date.now()}@agency.test`;
const password = "password123";
const notes: Array<string | Record<string, unknown>> = [];
const errors: string[] = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(30000);
page.on("pageerror", (err) => errors.push(String(err)));

async function shot(name: string) {
  await page.screenshot({ path: `/workspace/screenshots/${name}`, fullPage: true });
  notes.push(`saved ${name}`);
}

async function overflow() {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  );
}

async function dismissWelcome() {
  const skip = page.getByRole("button", { name: /Skip for now|I’ll do this later/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  const closeDlg = page.getByRole("button", { name: "Close" });
  if (await closeDlg.isVisible().catch(() => false)) await closeDlg.click();
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await shot("qa-mobile-login.png");
  notes.push({ loginOverflow: await overflow() });

  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Mobile QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.waitForTimeout(600);
  await dismissWelcome();

  await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 20000 });
  notes.push({
    dashOverflow: await overflow(),
    hamburger: await page.getByRole("button", { name: "Open navigation" }).isVisible(),
  });
  await shot("qa-mobile-dashboard.png");

  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Social", exact: true }).click();
  await page.waitForURL(/\/social/, { timeout: 15000 });
  await page.getByRole("heading", { name: "Social", exact: true }).waitFor({ timeout: 20000 });
  const socialBody = await page.locator("body").innerText();
  notes.push({
    socialOverflow: await overflow(),
    hasStart: /Start Social Machine/i.test(socialBody),
    hasUploadFab: await page.getByRole("button", { name: "Open 1-click upload" }).isVisible(),
    hasVncRequired: /must use the stream/i.test(socialBody),
  });
  await shot("qa-mobile-social-tab.png");

  await page.getByRole("button", { name: "Open 1-click upload" }).click();
  await page.getByRole("heading", { name: "1-click upload" }).first().waitFor({ timeout: 8000 });
  notes.push({ uploadSheet: true });
  await shot("qa-mobile-social-upload.png");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("heading", { name: "Automation & Hermes" }).waitFor({ timeout: 20000 });
  const settingsBody = await page.locator("body").innerText();
  notes.push({
    settingsOverflow: await overflow(),
    hasSocialPlaybook: /Social Machine cost guard|Distribute published/i.test(settingsBody),
    hasWriteSocial: /write:social|Social machine & upload/i.test(settingsBody),
    hasAutoStartPolicy: /social.auto_start_for_upload/i.test(settingsBody),
  });
  await shot("qa-mobile-settings-automation.png");

  const overflowHits = ["loginOverflow", "dashOverflow", "socialOverflow", "settingsOverflow"].filter(
    (key) => notes.some((row) => typeof row === "object" && row !== null && row[key] === true),
  );
  if (overflowHits.length) errors.push(`horizontal overflow: ${overflowHits.join(", ")}`);

  writeFileSync("/workspace/screenshots/qa-mobile-social.json", JSON.stringify({ notes, errors }, null, 2));
  console.log(JSON.stringify({ notes, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
} catch (error) {
  await shot("qa-mobile-social-error.png");
  console.error(error);
  writeFileSync(
    "/workspace/screenshots/qa-mobile-social.json",
    JSON.stringify({ notes, errors: [...errors, String(error)] }, null, 2),
  );
  process.exit(1);
} finally {
  await browser.close();
}
