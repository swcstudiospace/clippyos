#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);

async function shot(name: string) {
  await page.screenshot({ path: `/workspace/screenshots/${name}`, fullPage: true });
  console.log("saved", name, "url=", page.url());
}

interface PerformanceFlags {
  publishedHeading?: boolean;
  emptyStats?: boolean;
  manualHonesty?: boolean;
  learningHeading?: boolean;
  proposalsHeading?: boolean;
  autoMergeOff?: boolean;
  library?: boolean;
}
const flags: PerformanceFlags = {};
try {
  await page.goto(`${base}/home`, { waitUntil: "domcontentloaded" });

  await page.locator('a.sidebar-item[href="/analytics"]').click();
  await page.waitForURL("**/analytics");
  await page.getByRole("heading", { name: "Analytics" }).waitFor();
  await page.getByRole("heading", { name: "Published performance" }).scrollIntoViewIfNeeded();
  flags.publishedHeading = (await page.getByRole("heading", { name: "Published performance" }).count()) > 0;
  flags.emptyStats = (await page.getByText("No published stats yet").count()) > 0;
  flags.manualHonesty = (await page.getByText(/never zero|unknown, not zero/i).count()) > 0;
  await shot("qa-performance-analytics.png");

  await page.locator('a.sidebar-item[href="/settings"]').click();
  await page.waitForURL("**/settings");
  await page.getByRole("heading", { name: "AI Training" }).scrollIntoViewIfNeeded();
  await page.getByRole("heading", { name: "Learning from winners" }).waitFor({ timeout: 20000 });
  flags.learningHeading = true;
  await page.getByRole("heading", { name: "Proposals from performance" }).waitFor({ timeout: 20000 });
  flags.proposalsHeading = true;
  flags.autoMergeOff = (await page.getByText("learning.autoMerge").count()) > 0;
  await shot("qa-performance-training.png");

  await page.locator('a.sidebar-item[href="/library"]').click();
  await page.waitForURL("**/library");
  await page.getByRole("heading", { name: "Library" }).waitFor();
  flags.library = true;
  await shot("qa-performance-library.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/analytics`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Published performance" }).scrollIntoViewIfNeeded();
  await shot("qa-performance-analytics-mobile.png");

  console.log(JSON.stringify(flags, null, 2));
  const failed = Object.entries(flags).filter(([, v]) => !v).map(([k]) => k);
  if (failed.length) {
    console.error("FAILED flags", failed);
    process.exitCode = 1;
  }
} catch (error) {
  console.error("QA failed", error);
  await shot("qa-performance-error.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
