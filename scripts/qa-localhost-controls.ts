import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Locator } from "playwright";

// Exercise only view state, filters, and unsaved forms. No job or data mutations.
const base = "http://127.0.0.1:8080";
const out = `dogfood-output/controls-audit-${new Date().toISOString().replace(/[:.]/g, "-")}`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const actions: Record<string, unknown>[] = [];
const errors: Record<string, unknown>[] = [];
let current = "start";
page.on("pageerror", (e) => errors.push({ current, kind: "pageerror", error: e.message }));
page.on("console", (m) => {
  if (m.type() === "error") errors.push({ current, kind: "console", error: m.text() });
});
page.on("response", (r) => {
  if (r.status() >= 400) errors.push({ current, kind: "http", status: r.status(), url: r.url() });
});
page.on("dialog", async (d) => {
  errors.push({ current, kind: "dialog", message: d.message() });
  await d.dismiss();
});
async function record(name: string, f: () => Promise<unknown>) {
  current = name;
  const before = await page
    .locator("body")
    .ariaSnapshot()
    .catch(() => "Snapshot timed out");
  const start = Date.now();
  try {
    await f();
    actions.push({
      name,
      status: "pass",
      ms: Date.now() - start,
      before,
      after: await page
        .locator("body")
        .ariaSnapshot()
        .catch(() => "Snapshot timed out"),
    });
    console.log(`PASS ${name}`);
  } catch (e) {
    actions.push({
      name,
      status: "fail",
      ms: Date.now() - start,
      error: String(e),
      before,
      after: await page
        .locator("body")
        .ariaSnapshot()
        .catch(() => "Snapshot timed out"),
    });
    console.log(`FAIL ${name}: ${String(e).slice(0, 200)}`);
  }
  writeFileSync(`${out}/actions.json`, JSON.stringify({ actions, errors }, null, 2));
}
async function go(path: string) {
  await record(`Open ${path}`, async () => {
    const r = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    assert.equal(r?.status(), 200);
    await page.locator("main h1").waitFor({ timeout: 45000 });
    if (path === "/settings") {
      await page.locator("#integrations").waitFor({ timeout: 45000 });
      await page
        .locator("#integrations")
        .getByRole("heading", { name: "Whop Billing", exact: true })
        .waitFor({ timeout: 45000 });
    }
  });
}
async function button(name: string) {
  await record(`Click ${new URL(page.url()).pathname}: ${name}`, () =>
    page.getByRole("button", { name, exact: true }).first().click(),
  );
}
async function text(label: string, value: string) {
  await record(`Type ${label}: ${value}`, async () => {
    const target = page.getByRole("textbox", { name: label, exact: true });
    await target.fill(value);
    assert.equal(await target.inputValue(), value);
  });
}
async function escape() {
  await record("Escape closes overlay", () => page.keyboard.press("Escape"));
}
async function filters(group: Locator) {
  const names = await group.getByRole("button").allTextContents();
  for (const name of names) {
    await record(`Filter ${name.trim()}`, async () => {
      const b = group.getByRole("button", { name: name.trim(), exact: true });
      await b.click();
      assert.equal(await b.getAttribute("aria-pressed"), "true");
    });
  }
}
async function options(label: string) {
  const selector = page.getByRole("combobox", { name: label, exact: true });
  await record(`Open ${label} options`, () => selector.click());
  const names = await page.getByRole("option").allTextContents();
  await escape();
  for (const name of names) {
    await record(`Select ${label}: ${name.trim()}`, async () => {
      await selector.click();
      await page.getByRole("option", { name: name.trim(), exact: true }).click();
      assert.match(
        await selector.innerText(),
        new RegExp(name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
    });
  }
}
async function modal(open: string, title: string) {
  await button(open);
  await record(`Dialog ${title} is visible`, () =>
    page.getByRole("dialog", { name: title, exact: true }).waitFor(),
  );
  await escape();
  await record(`Dialog ${title} closes`, () =>
    page.getByRole("dialog", { name: title, exact: true }).waitFor({ state: "hidden" }),
  );
}
try {
  await go("/agent");
  const skip = page.getByRole("button", { name: "Skip for now", exact: true });
  await skip.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  if (await skip.isVisible()) await button("Skip for now");

  await go("/clients");
  for (const name of ["Active", "Churned", "All statuses"]) await button(name);
  await text("Search clients", "QA-NO-MATCH");
  await text("Search clients", "");
  await button("Edit");
  await button("Edit");
  await modal("Add Client", "Add Client");
  await page.screenshot({ path: `${out}/clients.png`, fullPage: true });

  await go("/leads");
  await filters(page.getByRole("group", { name: "Filter by status" }));
  await text("Search leads", "QA-NO-MATCH");
  await text("Search leads", "");
  await modal("Add lead", "Add lead");

  await go("/money");
  await page.getByRole("group", { name: "Reporting period" }).waitFor();
  await filters(page.getByRole("group", { name: "Reporting period" }));

  await go("/calendar");
  await button("Previous month");
  await button("Next month");
  await button("Next month");
  await button("Today");
  await filters(page.getByRole("group", { name: "Cash collected range" }));
  const day = page.locator("main [role=button]").first();
  await record("Open calendar day with mouse", () => day.click());
  await escape();
  await record("Open calendar day with Enter", async () => {
    await day.focus();
    await day.press("Enter");
    await page.getByRole("dialog").waitFor();
  });
  await escape();

  await go("/library");
  for (const label of ["Client", "Kind", "Source", "Status", "Date"]) await options(label);
  await text("Search", "QA-NO-MATCH");
  await text("Search", "");
  await button("Generate");
  await page.screenshot({ path: `${out}/library-generate.png`, fullPage: true });
  await button("Renders");
  await page.screenshot({ path: `${out}/library-renders.png`, fullPage: true });
  await button("Assets");
  await text("Import URL", "not-a-url");
  await text("Import URL", "");

  await go("/approvals");
  await button("All");
  await button("Waiting");
  await go("/analytics");
  await page.getByRole("group", { name: "Platform filter" }).waitFor();
  for (const name of ["All platforms", "X", "TikTok", "Instagram", "YouTube", "Winners only"]) {
    await record(`Analytics platform ${name}`, () =>
      page
        .getByRole("group", { name: "Platform filter" })
        .getByRole("button", { name, exact: true })
        .click(),
    );
  }
  await text("Channel URL or ID", "https://www.youtube.com/@RickAstleyYT");
  await text("Channel URL or ID", "");
  await go("/team");
  const addHuman = page.getByRole("button", { name: "Add human", exact: true });
  if (await addHuman.isVisible()) await modal("Add human", "Add human");

  await go("/social");
  await page.setViewportSize({ width: 390, height: 844 });
  await button("Open 1-click upload");
  await page.screenshot({ path: `${out}/social-upload.png`, fullPage: true });
  await escape();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/settings");
  const guides = page
    .locator("#integrations")
    .getByRole("button", { name: "Setup Guide", exact: true });
  const guideCount = await guides.count();
  for (let i = 0; i < guideCount; i++) {
    await record(`Integration setup guide ${i + 1}`, async () => {
      await guides.nth(i).click();
      await page.getByRole("dialog").waitFor();
    });
    await escape();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  const summaries = page.locator("main details > summary");
  for (let i = 0; i < (await summaries.count()); i++) {
    await record(`Open Settings details ${i}`, () => summaries.nth(i).click());
  }
  const viewSchema = page.getByRole("button", { name: /View.*SQL|View schema/i });
  if ((await viewSchema.count()) === 1 && (await viewSchema.isEnabled())) {
    await record("Open schema viewer", () => viewSchema.click());
    await escape();
  }
  await page.screenshot({ path: `${out}/settings.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await go("/agent");
  for (const name of ["Open runs", "Open context"]) {
    await button(name);
    await page.screenshot({
      path: `${out}/mobile-${name.replaceAll(" ", "-")}.png`,
      fullPage: true,
    });
    await escape();
  }
  await button("Open navigation");
  await record("Mobile navigation exposes Library", async () => {
    const menu = page.getByRole("dialog");
    await menu.waitFor();
    await menu.getByRole("link", { name: "Library", exact: true }).click();
    await page.getByRole("heading", { name: "Library", exact: true, level: 1 }).waitFor();
  });
  const mobileSnapshot = await page.locator("body").ariaSnapshot();
  actions.push({
    name: "Mobile navigation inventory",
    status: "observed",
    snapshot: mobileSnapshot,
  });
} finally {
  writeFileSync(
    `${out}/results.json`,
    JSON.stringify(
      {
        base,
        browser: browser.version(),
        completedAt: new Date().toISOString(),
        actions,
        errors,
        limits:
          "Only view-state changes and unsaved form opens. No service calls that generate, publish, delete, or charge.",
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      output: `${out}/results.json`,
      actions: actions.length,
      failures: actions.filter((a) => a.status === "fail").length,
      errors: errors.length,
    }),
  );
  if (actions.some((a) => a.status === "fail")) process.exitCode = 1;
  await browser.close();
}
