#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `thumb.${Date.now()}@agency.test`;
const password = "password123";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(20000);

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
  await page.getByLabel("Name").fill("Thumb QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });
  await page.getByRole("link", { name: "Thumbnails" }).click();
  await page.waitForURL("**/thumbnails");
  await page.getByText("Make a thumbnail that stops the scroll").waitFor();
  await shot("qa-thumbnails-empty.png");

  const placeholder = await page.getByPlaceholder("Describe a thumbnail or paste a video topic...").count();
  const sendDisabled = await page.getByRole("button", { name: "Send" }).isDisabled();
  console.log({ placeholder, sendDisabled });

  await page.getByRole("link", { name: "Clients" }).click();
  await page.getByRole("button", { name: "Add Client" }).click();
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await page.getByLabel("Name").fill("Thumb Lab");
  await page.getByRole("button", { name: "Save client" }).click();
  await page.getByText("Thumb Lab").first().waitFor({ timeout: 20000 });

  await page.getByRole("link", { name: "Thumbnails" }).click();
  await page.getByRole("button", { name: "Select client" }).click();
  await page.getByRole("option", { name: "Thumb Lab" }).first().click();
  await page.getByPlaceholder("Describe a thumbnail or paste a video topic...").fill(
    "Bold 16:9 thumbnail for a video about morning routines. Intense close-up, yellow accent, two words of text.",
  );
  await page.getByRole("button", { name: "Send" }).click();
  await page.waitForTimeout(4000);
  await shot("qa-thumbnails-sending.png");
  await page.waitForTimeout(20000);
  await shot("qa-thumbnails-direction.png");
  await page.waitForTimeout(50000);
  await shot("qa-thumbnails-chat.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Open sessions" }).click();
  await page.waitForTimeout(400);
  await shot("qa-thumbnails-mobile-sessions.png");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.waitForTimeout(400);
  await shot("qa-thumbnails-mobile.png");
} catch (error) {
  console.error("QA failed", error);
  await shot("qa-thumbnails-error.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
