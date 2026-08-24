import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = "http://127.0.0.1:8080";
const email = `ops.linear.${Date.now()}@agency.test`;
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
  await page.getByLabel("Name").fill("Linear QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await dismissWelcome();

  await page.goto(base + "/settings#integrations", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Add-ons" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(800);
  const integrationsBody = await page.locator("body").innerText();
  notes.push({
    integrations: {
      linearCard: /\bLinear\b/.test(integrationsBody) && /Kanban/.test(integrationsBody),
      apiKey: /lin_api_/.test(integrationsBody) || /Personal API key|API key/.test(integrationsBody),
      setup: /Setup Guide/.test(integrationsBody),
    },
  });
  await page.screenshot({ path: "/workspace/screenshots/qa-linear-integrations.png", fullPage: true });

  await page.goto(base + "/settings#linear", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Linear", exact: true }).first().waitFor({ timeout: 25000 }).catch(() => {});
  await page.locator("#linear").waitFor({ timeout: 25000 });
  await page.locator("#linear").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const linearBody = await page.locator("#linear").innerText();
  notes.push({
    linear: {
      heading: /Linear/.test(linearBody),
      kanban: /Backlog/.test(linearBody) && /In Review/.test(linearBody) && /Done/.test(linearBody),
      test: /Test Connection/.test(linearBody),
      disconnect: /Disconnect/.test(linearBody) || /Not configured/.test(linearBody),
      enabled: /LINEAR_ENABLED/.test(linearBody),
      autoFail: /Auto-issue on fail/.test(linearBody),
      sync: /Sync linked jobs/.test(linearBody),
      milestones: /M1–M7|M1-M7/.test(linearBody),
      error: /Couldn’t load Linear/.test(linearBody),
    },
  });
  await page.locator("#linear").screenshot({ path: "/workspace/screenshots/qa-linear-settings.png" });
  await page.screenshot({ path: "/workspace/screenshots/qa-linear-settings-full.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(base + "/login", { waitUntil: "domcontentloaded" });
  await mobile.getByLabel("Email").fill(email);
  await mobile.getByLabel("Password").fill(password);
  await mobile.getByRole("button", { name: "Sign in" }).click();
  await mobile.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 }).catch(() => {});
  await mobile.goto(base + "/settings#linear", { waitUntil: "domcontentloaded" });
  await mobile.locator("#linear").waitFor({ timeout: 25000 }).catch(() => {});
  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: "/workspace/screenshots/qa-linear-mobile.png", fullPage: true });
  await mobile.close();
} catch (error) {
  errors.push(String(error));
  await page.screenshot({ path: "/workspace/screenshots/qa-linear-error.png", fullPage: true }).catch(() => {});
} finally {
  await browser.close();
  console.log(JSON.stringify({ errors, notes }, null, 2));
  if (errors.length) process.exit(1);
}
