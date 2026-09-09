#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);
const notes = [];

async function shot(name: string) {
  await page.screenshot({
    path: `/workspace/screenshots/${name}`,
    fullPage: true,
  });
  notes.push(`saved ${name} url=${page.url()}`);
  console.log("saved", name, "url=", page.url());
}

async function bodyText() {
  return page.locator("body").innerText();
}

try {
  // Super Admin Access is a LoginForm-only control; with VITE_AUTH_ENABLED=false every
  // request (including /login) auto-resolves to the shared dev-user server-side, so
  // LoginForm never renders here regardless of client cookies/context — untestable in
  // this mode. Land straight on the authenticated shell instead.
  await page.goto(`${base}/home`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  const welcome = await page.getByRole("heading", { name: "Welcome to Clippy Admin" }).count();
  notes.push({ welcomeModal: welcome > 0 });
  await shot("qa-welcome-modal.png");
  if (welcome > 0) {
    await page.getByRole("button", { name: "Get Started" }).click();
    await page.getByRole("heading", { name: /AI API setup/i }).waitFor({ timeout: 8000 });
    notes.push({ setupGuideOpened: true });
    await shot("qa-setup-guide-ai.png");
    await page.getByRole("button", { name: "Done" }).click();
  }

  await page.getByRole("link", { name: "Settings" }).click();
  await page.waitForURL("**/settings");
  await page.getByRole("heading", { name: "Add-on registry" }).waitFor();
  const settingsText = await bodyText();
  notes.push({
    hasAi: /AI API/.test(settingsText),
    hasHiggsfield: /Higgsfield/.test(settingsText),
    hasYoutube: /YouTube Data API/.test(settingsText),
    hasDiscord: /Discord Bot/.test(settingsText),
    hasNotion: /Notion/.test(settingsText),
    hasTeamAccess: /Team access/.test(settingsText),
    hasSuperAdminPw: /Super Admin Access/.test(settingsText),
    hasDiscordNote: /runs automatically about every 30 minutes/.test(settingsText),
  });
  await shot("qa-settings-integrations.png");

  await page.getByRole("button", { name: "Setup Guide" }).nth(4).click();
  await page.getByRole("heading", { name: /Discord bot setup/i }).waitFor();
  const guideText = await bodyText();
  notes.push({
    discordGuide: /Message Content Intent/.test(guideText),
    readOnly: /Do not grant Send Messages/.test(guideText),
  });
  await shot("qa-setup-guide-discord.png");
  await page.getByRole("button", { name: "Done" }).click();

  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.waitForURL((url) => url.pathname === "/" || url.pathname.endsWith("/"));
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  const dash = await bodyText();
  notes.push({
    dashDiscordNote: /Discord Status Agent is read-only/.test(dash),
  });
  await shot("qa-dashboard-discord-note.png");

  await page.getByRole("link", { name: "Ideation" }).click();
  await page.waitForURL("**/ideation");
  await page.waitForTimeout(600);
  const idea = await bodyText();
  notes.push({
    ideationBanner: /This feature requires AI API/.test(idea) || /Set it up now/.test(idea),
  });
  await shot("qa-ideation-banner.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await page.waitForURL("**/settings");
  await page.getByRole("heading", { name: "Add-on registry" }).waitFor();
  await shot("qa-settings-integrations-mobile.png");

  writeFileSync("/workspace/screenshots/qa-integrations.json", JSON.stringify(notes, null, 2));
  console.log(JSON.stringify(notes, null, 2));
} catch (error) {
  await shot("qa-integrations-error.png");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
