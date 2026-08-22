import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = "http://127.0.0.1:8080";
const email = `ops.pub.${Date.now()}@agency.test`;
const password = "password123";
const errors = [];
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
  await page.getByLabel("Name").fill("Publisher QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await dismissWelcome();

  await page.goto(base + "/settings#integrations", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Add-ons" }).waitFor({ timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(800);
  const integrationsBody = await page.locator("body").innerText();
  notes.push({
    integrations: {
      xCard: /X \(API publish\)/.test(integrationsBody),
      connectX: /Connect X/.test(integrationsBody),
      callback: /Copy callback|\/api\/oauth\/social/.test(integrationsBody),
      setup: /Setup Guide/.test(integrationsBody),
    },
  });

  await page.goto(base + "/settings#publishers", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Social publishers" }).waitFor({ timeout: 25000 });
  await page.getByText("OAuth callback URL").waitFor({ timeout: 25000 }).catch(() => notes.push("no callback heading"));
  await page.waitForTimeout(800);
  const settingsBody = await page.locator("body").innerText();
  notes.push({
    settings: {
      heading: /Social publishers/.test(settingsBody),
      callback: /OAuth callback URL/.test(settingsBody),
      igTitle: /Instagram \(Reels API\)/.test(settingsBody),
      igPersonal: /Personal accounts are not supported for API publish|Professional account/i.test(settingsBody),
      igConnect: /Connect Instagram/.test(settingsBody),
      tiktokAudit: /TikTok app audit|inbox drafts|Content Posting API/i.test(settingsBody),
      xDraft: /no draft API/i.test(settingsBody),
      connect: /Connect/.test(settingsBody),
      xTitle: /X \(API publish\)/.test(settingsBody),
      setup: /Setup Guide/i.test(settingsBody),
      error: /Couldn’t load publishers/.test(settingsBody),
    },
  });
  await page.locator("#publishers").screenshot({ path: "/workspace/screenshots/qa-publishers-settings.png" }).catch(() => {});
  await page.screenshot({ path: "/workspace/screenshots/qa-publishers-settings-full.png", fullPage: true });

  await page.goto(base + "/social", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Social", exact: true }).waitFor({ timeout: 25000 });
  await page.getByRole("heading", { name: "1-click upload" }).waitFor({ timeout: 25000 }).catch(() => notes.push("no 1-click heading"));
  await page.waitForTimeout(800);
  const socialBody = await page.locator("body").innerText();
  notes.push({
    social: {
      header: /Native APIs when connected/.test(socialBody),
      upload: /1-click upload/i.test(socialBody),
      rail: /Auto — API then Computer Use|preferredRail|Computer Use/i.test(socialBody),
      auto: /Auto — API then Computer Use/.test(socialBody),
      xBrowser: /API not connected — using browser/.test(socialBody),
      igBrowser: /API not connected — Browser only/.test(socialBody),
      mode: /\bDraft\b/.test(socialBody) && /\bPublish\b/.test(socialBody),
      apiNote: /without the machine|without starting the machine|API publishers/i.test(socialBody),
      error: /Couldn’t load Social/.test(socialBody),
    },
  });
  await page.screenshot({ path: "/workspace/screenshots/qa-publishers-social.png", fullPage: true });

  console.log(JSON.stringify({ notes, errors: errors.slice(0, 20), url: page.url() }, null, 2));
} catch (err) {
  await page.screenshot({ path: "/workspace/screenshots/qa-publishers-error.png", fullPage: true }).catch(() => {});
  console.error("FAIL", err);
  console.log(JSON.stringify({ notes, errors: errors.slice(0, 20), fail: String(err) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
