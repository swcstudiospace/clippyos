#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);
const notes = [];
const errors: string[] = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error" && !msg.text().includes("grok-app-builder/extensions.js")) {
    errors.push(msg.text());
  }
});

async function shot(name: string) {
  await page.screenshot({ path: `/workspace/screenshots/${name}`, fullPage: true });
  notes.push(`saved ${name} url=${page.url()}`);
}

try {
  await page.goto(`${base}/health`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /Health|Subscribe to ClippyOS|Dashboard/ }).waitFor({ timeout: 15000 });
  const heading = page.getByRole("heading", { name: "Health" });
  const visible = await heading.isVisible().catch(() => false);
  const body = await page.locator("body").innerText();
  notes.push({
    url: page.url(),
    hasHeading: visible,
    hasSlo: /Upload success|Queue depth|Needs login/i.test(body),
    hasHermes: /Hermes worker|Last login/i.test(body),
    hasJobFeed: /Job feed|No jobs in this filter|All status/i.test(body),
    hasMobileCopy: /Phone: chips, then cards/i.test(body),
    hasDlq: /DLQ/i.test(body),
    comingSoon: /Coming soon/i.test(body),
    billingGate: /Subscribe|checkout|Billing/i.test(body) && !visible,
  });
  await shot("qa-health-desktop.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  notes.push({ mobileOverflow: overflow });
  await shot("qa-health-mobile.png");

  writeFileSync("/workspace/screenshots/qa-health.json", JSON.stringify({ notes, errors }, null, 2));
  console.log(JSON.stringify({ ok: errors.length === 0 && visible, notes, errors }, null, 2));
  if (errors.length || !visible) process.exit(1);
} catch (error) {
  await shot("qa-health-error.png");
  console.error(error);
  process.exit(1);
} finally {
  await browser.close();
}
