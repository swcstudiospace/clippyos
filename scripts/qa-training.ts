#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `train.${Date.now()}@agency.test`;
const password = "password123";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(25000);

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
  await page.getByLabel("Name").fill("Training QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });

  await page.getByRole("link", { name: "Settings" }).click();
  await page.waitForURL("**/settings");
  await page.getByRole("heading", { name: "AI Training" }).waitFor();
  await page.getByRole("heading", { name: "Thumbnail Training" }).waitFor();
  await page.getByRole("heading", { name: "Video & Ideation Training" }).waitFor();
  await page.getByPlaceholder("Paste examples, principles, references, or explanations…").first().waitFor();
  await shot("qa-training-empty.png");

  const viewButtons = page.getByRole("button", { name: "View current knowledge" });
  const resetButtons = page.getByRole("button", { name: "Reset knowledge" });
  console.log({
    viewCount: await viewButtons.count(),
    resetDisabled: [
      await resetButtons.nth(0).isDisabled(),
      await resetButtons.nth(1).isDisabled(),
    ],
    composers: await page.getByPlaceholder("Paste examples, principles, references, or explanations…").count(),
  });

  await viewButtons.first().click();
  await page.getByRole("heading", { name: /Current Thumbnails knowledge/i }).waitFor();
  await page.waitForTimeout(1500);
  await shot("qa-training-view.png");
  await page.keyboard.press("Escape");

  const thumbInput = page.getByPlaceholder("Paste examples, principles, references, or explanations…").first();
  await thumbInput.fill(
    "Faces should fill at least 40% of the frame. Use complementary high-contrast colors. Keep on-image text to 1–3 words, extra bold, readable at postage-stamp size.",
  );
  const sendButtons = page.getByRole("button", { name: "Send" });
  await sendButtons.first().click();
  await page.waitForTimeout(3000);
  await shot("qa-training-sending.png");
  await page.waitForTimeout(25000);
  await shot("qa-training-reply.png");

  const videoInput = page.getByPlaceholder("Paste examples, principles, references, or explanations…").nth(1);
  await videoInput.fill("Shift+Enter keeps a newline.\nEnter should send.");
  await videoInput.press("Shift+Enter");
  await videoInput.type("Second line stays.");
  const value = await videoInput.inputValue();
  console.log({ shiftEnterKeepsNewline: value.includes("\n") });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.getByRole("heading", { name: "AI Training" }).scrollIntoViewIfNeeded();
  await shot("qa-training-mobile.png");
} catch (error) {
  console.error("QA failed", error);
  await shot("qa-training-error.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
