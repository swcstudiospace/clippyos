import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = "http://127.0.0.1:8080";
const email = `ops.portal.${Date.now()}@agency.test`;
const password = "password123";
const portalEmail = `brand.portal.${Date.now()}@client.test`;
const errors = [];
const notes = {};

async function shot(p, name) {
  try {
    await p.screenshot({
      path: `/workspace/screenshots/${name}`,
      fullPage: true,
      timeout: 12000,
      animations: "disabled",
    });
  } catch (error) {
    notes[`shot_${name}`] = String(error).slice(0, 160);
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(40000);
page.on("pageerror", (err) => errors.push("pageerror:" + String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error" && !msg.text().includes("favicon") && !msg.text().includes("hydrated")) {
    errors.push("console:" + msg.text());
  }
});

async function dismissWelcome(p = page) {
  const skip = p.getByRole("button", { name: /Skip for now|I’ll do this later/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  const closeDlg = p.getByRole("button", { name: "Close" });
  if (await closeDlg.isVisible().catch(() => false)) await closeDlg.click();
}

try {
  await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading").first().waitFor({ timeout: 20000 });
  notes.staffLoginHasPortalLink = /Open the client portal/.test(await page.locator("body").innerText());

  await page.goto(base + "/portal/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading").first().waitFor({ timeout: 20000 });
  const loginBody = await page.locator("body").innerText();
  notes.portalLogin = {
    url: page.url(),
    heading: /portal|Clippy|Client/i.test(loginBody),
    password: /Password/i.test(loginBody),
    staffLink: /Staff sign in/i.test(loginBody),
    noMoney: !/Team costs|Invoices|Hermes/i.test(loginBody),
  };
  await shot(page, "qa-portal-login.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(page, "qa-portal-login-mobile.png");
  await page.setViewportSize({ width: 1440, height: 900 });

  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(base + "/portal/home", { waitUntil: "domcontentloaded" });
  await anonPage.waitForTimeout(1200);
  notes.homeRequiresLogin =
    anonPage.url().includes("/portal/login") ||
    /Activate access|Open portal|Set a password/i.test(await anonPage.locator("body").innerText());
  await anonPage.goto(base + "/money", { waitUntil: "domcontentloaded" });
  await anonPage.waitForTimeout(800);
  const moneyBody = await anonPage.locator("body").innerText();
  notes.anonMoneyIsStaffLogin =
    /Private workspace|Sign in with your agency/i.test(moneyBody) &&
    !/Payment tracker|Cost \/ profit|MRR/i.test(moneyBody);
  await shot(anonPage, "qa-portal-money-blocked.png");
  await anon.close();

  await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Need an account\? Create one/i }).click();
  await page.getByLabel("Name").fill("Portal QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await dismissWelcome();

  await page.goto(base + "/settings#portal", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(800);
  const settingsBody = await page.locator("body").innerText();
  notes.settings = {
    url: page.url(),
    panel: /Client portal/.test(settingsBody) && /Enable portal/.test(settingsBody),
    billingGate: /Subscribe to Clippy Admin|Workspace billing required/i.test(settingsBody),
  };
  await shot(page, "qa-portal-settings.png");

  await page.goto(base + "/clients", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(800);
  const clientsBody = await page.locator("body").innerText();
  notes.clients = {
    url: page.url(),
    heading: /Clients/.test(clientsBody),
    billingGate: /Subscribe to Clippy Admin|Workspace billing required/i.test(clientsBody),
  };
  await shot(page, "qa-portal-client.png");

  if (!notes.clients.billingGate && (await page.getByRole("button", { name: "Add Client" }).count())) {
    await page.getByRole("button", { name: "Add Client" }).first().click();
    await page.getByRole("button", { name: "Enter details manually" }).click();
    await page.locator("#client-name").fill("Northstar Media");
    await page.getByRole("button", { name: "Save client" }).click();
    await page.waitForURL((url) => /\/clients\/[^/]+/.test(url.pathname), { timeout: 20000 });
    await page.waitForTimeout(800);
    const detail = await page.locator("body").innerText();
    notes.clientPanel = {
      heading: /Portal access/.test(detail),
      invite: /Invite email/.test(detail),
      preview: /View as client/.test(detail),
    };
    await shot(page, "qa-portal-client.png");
    if (notes.clientPanel.invite) {
      await page.getByLabel("Invite email").fill(portalEmail);
      await page.getByRole("button", { name: "Send invite" }).click();
      await page.getByText("Magic invite link", { exact: false }).waitFor({ timeout: 15000 });
      const inviteCode = await page.locator("code").last().innerText();
      notes.inviteUrl = inviteCode.includes("invite=") ? inviteCode : null;
      await shot(page, "qa-portal-invite.png");
      if (notes.inviteUrl) {
        const portalCtx = await browser.newContext();
        const portalPage = await portalCtx.newPage();
        const invitePath = notes.inviteUrl.replace(/^https?:\/\/[^/]+/, base);
        await portalPage.goto(invitePath, { waitUntil: "domcontentloaded" });
        await portalPage.getByLabel("Set a password").fill(password);
        await portalPage.getByRole("button", { name: "Activate access" }).click();
        await portalPage.waitForURL((url) => url.pathname.includes("/portal/home"), { timeout: 20000 });
        await portalPage.waitForTimeout(800);
        const homeBody = await portalPage.locator("body").innerText();
        notes.portalHome = {
          client: /Northstar Media/.test(homeBody),
          stage: /Production stage/.test(homeBody),
          noMoney: !/Monthly fee|Team cost|Hermes/i.test(homeBody),
        };
        await shot(portalPage, "qa-portal-home.png");
        await portalPage.setViewportSize({ width: 390, height: 844 });
        await shot(portalPage, "qa-portal-home-mobile.png");
        await portalPage.goto(base + "/portal/assets", { waitUntil: "domcontentloaded" });
        await portalPage.waitForTimeout(400);
        await shot(portalPage, "qa-portal-assets.png");
        await portalPage.goto(base + "/money", { waitUntil: "domcontentloaded" });
        await portalPage.waitForTimeout(800);
        const blocked = await portalPage.locator("body").innerText();
        notes.portalUserMoneyBlocked =
          /Private workspace|Sign in with your agency/i.test(blocked) &&
          !/Payment tracker|Cost \/ profit/i.test(blocked);
        await portalCtx.close();
      }
    }
  }
} catch (error) {
  errors.push(String(error));
  await shot(page, "qa-portal-error.png");
}

writeFileSync("/workspace/screenshots/qa-portal.json", JSON.stringify({ notes, errors }, null, 2));
await browser.close();
console.log(JSON.stringify({ notes, errors }, null, 2));
