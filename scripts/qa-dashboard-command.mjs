#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `ops.dash.${Date.now()}@agency.test`;
const password = "password123";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(28000);
const notes = [];
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

async function shot(name) {
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
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Ops QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.waitForTimeout(600);

  const skipWelcome = page.getByRole("button", { name: /Skip for now|I’ll do this later|Continue/i });
  if (await skipWelcome.first().isVisible().catch(() => false)) {
    await skipWelcome.first().click();
    await page.waitForTimeout(300);
  }
  const closeDlg = page.getByRole("button", { name: "Close" });
  if (await closeDlg.isVisible().catch(() => false)) {
    await closeDlg.click();
  }

  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  const empty = await bodyText();
  notes.push({
    hasMrr: /Total MRR/i.test(empty),
    hasClients: /Total clients/i.test(empty),
    hasRevenue: /Revenue this month/i.test(empty),
    hasOutstanding: /Outstanding payments/i.test(empty),
    hasAtRisk: /Clients at risk/i.test(empty),
    hasPipeline: /Production pipeline/i.test(empty),
    hasStages: /Client stages/i.test(empty),
    hasGuarantee: /30-day guarantee/i.test(empty),
    hasActivity: /Recent activity/i.test(empty),
    hasQuickAdd: /Add Client/i.test(empty),
    hasCalendar: /Open Calendar/i.test(empty),
    hasRefresh: /Refresh Analytics/i.test(empty),
    hasIdeation: /Open Ideation/i.test(empty),
    noUpcomingPayments: !/upcoming payment/i.test(empty),
    emptyActivity: /No recent activity yet/i.test(empty),
    emptyPipeline: /Stage counts appear once you have active clients/i.test(empty),
  });
  await shot("qa-dashboard-command-empty.png");

  await page.getByRole("button", { name: "Add Client" }).first().click();
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await page.getByLabel("Name").fill("Northstar Media");
  await page.getByRole("button", { name: "Save client" }).click().catch(async () => {
    await page.getByRole("button", { name: /^Save/ }).last().click();
  });
  await page.waitForURL((url) => url.pathname.includes("/clients/"), { timeout: 20000 });
  await page.waitForTimeout(400);

  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/" || url.pathname.endsWith("/"), { timeout: 15000 });
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  await page.waitForTimeout(500);

  const filled = await bodyText();
  notes.push({
    clientCard: /Northstar Media/i.test(filled),
    notStarted: /Not started/i.test(filled),
    dayCount: /Day 1\/30/i.test(filled),
    onTrack: /On track/i.test(filled),
    insufficient: /Insufficient data/i.test(filled),
    joinedRoster: /joined the roster/i.test(filled),
    noUpcoming: !/upcoming payment/i.test(filled),
  });
  await shot("qa-dashboard-command-filled.png");

  const notStarted = page.getByRole("button", { name: /Not started/i });
  if (await notStarted.isVisible()) {
    await notStarted.click();
    await page.waitForTimeout(200);
    notes.push({ filterPressed: await notStarted.getAttribute("aria-pressed") });
  }

  await page.getByRole("link", { name: "Leads" }).click();
  await page.waitForURL("**/leads");
  await page.getByRole("button", { name: "Add lead" }).click();
  await page.getByLabel("Name").fill("Orbit Labs");
  await page.getByRole("button", { name: "Add lead" }).nth(1).click().catch(async () => {
    await page.getByRole("button", { name: "Add lead" }).last().click();
  });
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.waitForTimeout(500);
  const withLead = await bodyText();
  notes.push({ newLead: /New lead · Orbit Labs/i.test(withLead) });
  await shot("qa-dashboard-command-activity.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await shot("qa-dashboard-command-mobile.png");

  writeFileSync(
    "/workspace/screenshots/qa-dashboard-command.json",
    JSON.stringify({ notes, errors, email }, null, 2),
  );
  console.log(JSON.stringify({ notes, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
} catch (error) {
  await shot("qa-dashboard-command-error.png");
  console.error(error);
  writeFileSync(
    "/workspace/screenshots/qa-dashboard-command.json",
    JSON.stringify({ notes, errors: [...errors, String(error)] }, null, 2),
  );
  process.exit(1);
} finally {
  await browser.close();
}
