#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `ops.team.${Date.now()}@agency.test`;
const password = "password123";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);
const notes = [];
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

async function shot(name) {
  await page.screenshot({ path: `/workspace/screenshots/${name}`, fullPage: true });
  notes.push(`saved ${name} url=${page.url()}`);
}

try {
  await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Ops QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });
  await page.goto(`${base}/team`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Team" }).waitFor();
  const body = await page.locator("body").innerText();
  notes.push({
    hasHumans: /Humans/i.test(body),
    hasAi: /AI teammates/i.test(body),
    hasCapacity: /Capacity tracker|No one is assigned/i.test(body),
    hasAddAi: /Add AI teammate/i.test(body),
    hasAddHuman: /Add human/i.test(body),
    hasHeadcount: /never inflate headcount/i.test(body),
    comingSoon: /Coming soon/i.test(body),
  });
  await shot("qa-team-desktop.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  notes.push({ mobileOverflow: overflow });
  await shot("qa-team-mobile.png");

  if (notes[0]?.hasAddAi) {
    await page.getByRole("button", { name: "Add AI teammate" }).first().click();
    await page.getByRole("heading", { name: "Add AI teammate" }).waitFor();
    await page.getByRole("button", { name: "Clippy Ops" }).click();
    await page.getByRole("button", { name: "Add to roster" }).click();
    await page.getByText("Clippy Ops", { exact: false }).waitFor({ timeout: 15000 });
    await shot("qa-team-clippy-added.png");
  }

  writeFileSync("/workspace/screenshots/qa-team-automation.json", JSON.stringify({ notes, errors }, null, 2));
  console.log(JSON.stringify({ ok: errors.length === 0, notes, errors }, null, 2));
  if (errors.length) process.exit(1);
} catch (error) {
  await shot("qa-team-error.png");
  console.error(error);
  process.exit(1);
} finally {
  await browser.close();
}
