#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const email = `mob.${Date.now()}@example.com`;
const clientName = `Mobile ${Date.now().toString().slice(-6)}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);

try {
  await page.goto("http://127.0.0.1:8080", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Mobile QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });
  await page.getByRole("link", { name: "Clients" }).click();
  await page.getByRole("button", { name: "Add Client" }).click();
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await page.getByLabel("Name").fill(clientName);
  await page.getByRole("button", { name: "Save client" }).click();
  await page.waitForURL(/\/clients\/[^/]+/, { timeout: 20000 });
  await page.getByRole("heading", { name: "Suggested Titles" }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.getByRole("heading", { name: "Suggested Titles" }).scrollIntoViewIfNeeded();
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  console.log(metrics);
  await page.screenshot({ path: "/workspace/screenshots/qa-client-suggestions-mobile.png", fullPage: true });
  await page.getByRole("heading", { name: "Suggested Ideas" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/workspace/screenshots/qa-client-suggestions-mobile-ideas.png", fullPage: true });
} catch (error) {
  console.error(error);
  await page.screenshot({ path: "/workspace/screenshots/qa-client-suggestions-mobile-error.png", fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
