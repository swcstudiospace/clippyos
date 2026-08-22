import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = "http://127.0.0.1:8080";
const email = `ops.safety.${Date.now()}@agency.test`;
const password = "password123";
const errors = [];
const notes = {};

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
  await page.getByLabel("Name").fill("Safety QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await dismissWelcome();

  const nav = await page.locator("nav[aria-label='Primary']").innerText();
  notes.navApprovals = /Approvals/.test(nav);
  notes.bell = await page.getByRole("button", { name: "Notifications" }).isVisible();

  await page.goto(base + "/approvals", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Approvals" }).waitFor({ timeout: 25000 });
  const approvalsBody = await page.locator("body").innerText();
  notes.approvalsHeading = /Approvals/.test(approvalsBody);
  notes.approvalsEmpty = /Nothing waiting|No approval history|Drafts skip/i.test(approvalsBody);
  notes.approvalsError = /Couldn’t load approvals/.test(approvalsBody);
  await page.screenshot({ path: "/workspace/screenshots/qa-approvals.png", fullPage: true });

  await page.goto(base + "/settings#approvals", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Settings" }).waitFor({ timeout: 25000 });
  await page.getByText("Require approval for live publishes").waitFor({ timeout: 25000 });
  await page.waitForTimeout(400);
  const settingsBody = await page.locator("body").innerText();
  notes.settings = {
    policy: /Require approval for live publishes/.test(settingsBody),
    selfApprove: /self-approve/i.test(settingsBody),
    channels: /Notification channels/.test(settingsBody),
    audit: /Audit log/.test(settingsBody),
    setup: /before the first client publish/i.test(settingsBody),
    error: /Couldn’t load safety settings/.test(settingsBody),
  };
  await page.screenshot({ path: "/workspace/screenshots/qa-safety-settings.png", fullPage: true });

  await page.goto(base + "/social", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Social", exact: true }).waitFor({ timeout: 25000 });
  const socialBody = await page.locator("body").innerText();
  notes.social = {
    heading: /Social/.test(socialBody),
    upload: /1-click upload/i.test(socialBody),
    error: /Couldn’t load Social/.test(socialBody),
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/approvals", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Approvals" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(400);
  notes.mobileApprovals = await page.getByRole("heading", { name: "Approvals" }).isVisible();
  notes.mobileBell = await page.getByRole("button", { name: "Notifications" }).isVisible();
  await page.screenshot({ path: "/workspace/screenshots/qa-approvals-mobile.png", fullPage: true });

  await page.getByRole("button", { name: "Notifications" }).click();
  await page.waitForTimeout(500);
  const sheet = await page.locator("body").innerText();
  notes.mobileSheet = /Notifications|No notifications yet|Ops alerts/i.test(sheet);
  await page.screenshot({ path: "/workspace/screenshots/qa-notifications-mobile.png" });
} catch (error) {
  notes.fatal = String(error);
  await page.screenshot({ path: "/workspace/screenshots/qa-safety-error.png" }).catch(() => {});
}

await browser.close();
writeFileSync(
  "/workspace/screenshots/qa-safety.json",
  JSON.stringify({ notes, errors: errors.slice(0, 20), errorCount: errors.length }, null, 2),
);
console.log(JSON.stringify({ notes, errorCount: errors.length, errors: errors.slice(0, 12) }, null, 2));
