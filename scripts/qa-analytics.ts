#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `analytics.${Date.now()}@agency.test`;
const password = "password123";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);

async function shot(name: string) {
  await page.screenshot({
    path: `/workspace/screenshots/${name}`,
    fullPage: true,
  });
  console.log("saved", name, "url=", page.url());
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Analytics QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });

  await page.locator('a.sidebar-item[href="/settings"]').click();
  await page.waitForURL("**/settings");
  await page.getByRole("heading", { name: "Grok 4.6" }).waitFor();
  await page.getByRole("heading", { name: "YouTube Data API" }).waitFor();
  await page.getByRole("heading", { name: "Higgsfield" }).waitFor();
  const grokBtn = page.getByRole("button", { name: /Connect SuperGrok|Disconnect SuperGrok|Platform key/i });
  console.log({
    grokHeading: await page.getByRole("heading", { name: "Grok 4.6" }).count(),
    youtubeHeading: await page.getByRole("heading", { name: "YouTube Data API" }).count(),
    grokButtons: await grokBtn.count(),
    connectLabel: await page.getByRole("button", { name: "Connect SuperGrok" }).count(),
  });
  await shot("qa-settings-grok.png");

  await page.locator('a.sidebar-item[href="/analytics"]').click();
  await page.waitForURL("**/analytics");
  await page.getByRole("heading", { name: "Analytics" }).waitFor();
  await page.getByRole("heading", { name: "Connect channel" }).waitFor();
  await page.getByRole("heading", { name: "Enter data manually" }).waitFor();
  await page.getByRole("button", { name: "All clients" }).waitFor();
  console.log({
    connect: await page.getByRole("button", { name: "Connect" }).count(),
    pull: await page.getByRole("button", { name: /Pull latest|Refresh Analytics/ }).count(),
    fallback: await page.getByText(/Automated YouTube pulls will be available/i).count(),
    emptyClients: await page.getByText(/No active clients/i).count(),
  });
  await shot("qa-analytics-empty.png");

  await page.locator('a.sidebar-item[href="/ideation"]').click();
  await page.waitForURL("**/ideation");
  await page.getByPlaceholder(/Ask anything about YouTube strategy/i).or(page.locator("textarea")).first().waitFor({ timeout: 15000 });
  await shot("qa-ideation-after-llm.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/analytics`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Analytics" }).waitFor();
  await shot("qa-analytics-mobile.png");
} catch (error) {
  console.error("QA failed", error);
  await shot("qa-analytics-error.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
