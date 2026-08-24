#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `ops.${Date.now()}@agency.test`;
const password = "password123";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(25000);
const notes = [];

async function shot(name: string) {
  await page.screenshot({
    path: `/workspace/screenshots/${name}`,
    fullPage: true,
  });
  notes.push(`saved ${name} url=${page.url()}`);
  console.log("saved", name, "url=", page.url());
}

async function textHas(re: RegExp) {
  const body = await page.locator("body").innerText();
  return re.test(body);
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Ops QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });
  await page.waitForTimeout(800);

  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  const dashHasComingSoon = await textHas(/Coming soon/i);
  const dashHasMrr = await textHas(/Total MRR/i);
  const dashHasObjectives = await textHas(/Daily Objectives/i);
  const dashHasStages = await textHas(/Client stages/i);
  notes.push({ dashHasComingSoon, dashHasMrr, dashHasObjectives, dashHasStages });
  await shot("qa-dashboard-home.png");

  await page.getByRole("link", { name: "Calendar" }).click();
  await page.waitForURL("**/calendar");
  await page.getByRole("heading", { name: "Calendar" }).waitFor();
  const calComingSoon = await textHas(/Coming soon/i);
  const calCash = await textHas(/Cash collected/i);
  notes.push({ calComingSoon, calCash });
  await shot("qa-calendar.png");

  await page.getByRole("link", { name: "Team" }).click();
  await page.waitForURL("**/team");
  await page.getByRole("heading", { name: "Team" }).waitFor();
  const teamComingSoon = await textHas(/Coming soon/i);
  const teamCapacity = await textHas(/Capacity tracker/i);
  notes.push({ teamComingSoon, teamCapacity });
  await shot("qa-team.png");

  await page.getByRole("link", { name: "Leads" }).click();
  await page.waitForURL("**/leads");
  await page.getByRole("heading", { name: "Leads" }).waitFor();
  const leadsComingSoon = await textHas(/Coming soon/i);
  await page.getByRole("button", { name: "Add lead" }).click();
  await page.getByLabel("Name").fill("Northstar Media");
  await page.getByLabel("Upfront cash").fill("30000");
  await page.getByLabel("Monthly recurring").fill("5000");
  await page.getByRole("button", { name: "In talks" }).click();
  await page.getByRole("button", { name: "Add lead" }).nth(1).click().catch(async () => {
    await page.getByRole("button", { name: "Add lead" }).last().click();
  });
  await page.getByRole("heading", { name: "Northstar Media" }).waitFor({ timeout: 15000 });
  const leadsTotals = await textHas(/Open upfront/i);
  notes.push({ leadsComingSoon, leadsTotals });
  await shot("qa-leads.png");

  await page.getByRole("link", { name: "Onboarding" }).click();
  await page.waitForURL("**/onboarding");
  await page.getByRole("heading", { name: "Onboarding" }).waitFor();
  const onbComingSoon = await textHas(/Coming soon/i);
  const onbGuide = await textHas(/First 30 days/i);
  const downloadBtn = page.getByRole("button", { name: "Download Client Agreement" });
  notes.push({
    onbComingSoon,
    onbGuide,
    downloadVisible: await downloadBtn.isVisible(),
  });
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }).catch(() => null),
    downloadBtn.click(),
  ]);
  notes.push({
    downloaded: download ? await download.suggestedFilename() : null,
  });
  await shot("qa-onboarding.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await shot("qa-onboarding-mobile.png");

  await page.goto(`${base}/calendar`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await shot("qa-calendar-mobile.png");

  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await shot("qa-dashboard-mobile.png");

  console.log(JSON.stringify(notes, null, 2));
  writeFileSync(
    "/workspace/screenshots/qa-remaining-tabs.json",
    JSON.stringify(notes, null, 2),
  );
} catch (error) {
  console.error("QA failed", error);
  await shot("qa-remaining-tabs-error.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
