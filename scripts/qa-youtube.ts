import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = "http://127.0.0.1:8080";
const email = `ops.yt.${Date.now()}@agency.test`;
const password = "password123";
const errors: string[] = [];
const notes = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(45000);
page.on("pageerror", (err) => errors.push("pageerror:" + String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push("console:" + msg.text());
});

async function dismissWelcome() {
  const skip = page.getByRole("button", { name: /Skip for now|I’ll do this later/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  const closeDlg = page.getByRole("button", { name: "Close" });
  if (await closeDlg.isVisible().catch(() => false)) await closeDlg.click();
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Need an account\? Create one/i }).click();
  await page.getByLabel("Name").fill("YouTube QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await dismissWelcome();

  await page.goto(base + "/settings#publishers", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Social publishers" }).waitFor({ timeout: 25000 });
  await page.getByRole("heading", { name: "YouTube (Publish)" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(600);
  const settingsBody = await page.locator("body").innerText();
  notes.push({
    settings: {
      ytTitle: /YouTube \(Publish\)/.test(settingsBody),
      distinctFromKey: /YouTube Data API upload needs an OAuth|youtube\.upload/.test(settingsBody),
      connect: /Connect YouTube/.test(settingsBody),
      verification: /app verification|test users/i.test(settingsBody),
      xUnchanged: /X \(API publish\)/.test(settingsBody),
      tiktokUnchanged: /TikTok \(Content Posting API\)/.test(settingsBody),
      igUnchanged: /Instagram \(Reels API\)/.test(settingsBody),
      error: /Couldn’t load publishers/.test(settingsBody),
    },
  });
  await page.getByRole("heading", { name: "YouTube (Publish)" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/workspace/screenshots/qa-youtube-settings.png", fullPage: true });

  await page.goto(base + "/social", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "1-click upload" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(400);
  const socialBody = await page.locator("body").innerText();
  notes.push({
    social: {
      youtubeRow: /\bYouTube\b/.test(socialBody),
      apiNote: /API not connected|Studio in the browser|API connected/.test(socialBody),
      upload: /1-click upload/.test(socialBody),
    },
  });
  await page.screenshot({ path: "/workspace/screenshots/qa-youtube-social.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/social", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/workspace/screenshots/qa-youtube-mobile.png" });
} catch (error) {
  notes.push({ error: String(error) });
  await page.screenshot({ path: "/workspace/screenshots/qa-youtube-error.png" }).catch(() => {});
}

writeFileSync("/workspace/screenshots/qa-youtube.json", JSON.stringify({ notes, errors: errors.slice(0, 20) }, null, 2));
await browser.close();
console.log(JSON.stringify({ notes, errorCount: errors.length }, null, 2));
