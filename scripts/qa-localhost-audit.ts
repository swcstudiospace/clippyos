import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Locator } from "playwright";
import { AGENT_SLASH_COMMANDS } from "../src/lib/agent-slash.ts";

// Read-only UI audit. Never submit jobs, change credentials, or force disabled controls.
const base = "http://127.0.0.1:8080";
const out = `dogfood-output/localhost-audit-${new Date().toISOString().replace(/[:.]/g, "-")}`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(10000);
const events: Record<string, unknown>[] = [];
const errors: Record<string, unknown>[] = [];
const routes: Record<string, unknown>[] = [];
const commands: Record<string, unknown>[] = [];
let current = "bootstrap";
page.on("pageerror", (error) =>
  errors.push({ action: current, kind: "pageerror", message: error.message }),
);
page.on("console", (msg) => {
  if (msg.type() === "error")
    errors.push({ action: current, kind: "console", message: msg.text() });
});
page.on("response", (r) => {
  if (r.status() >= 400)
    errors.push({ action: current, kind: "http", url: r.url(), status: r.status() });
});
page.on("requestfailed", (r) =>
  errors.push({ action: current, kind: "network", url: r.url(), failure: r.failure()?.errorText }),
);
page.on("dialog", async (d) => {
  errors.push({ action: current, kind: "dialog", message: d.message() });
  await d.dismiss();
});

async function snapshot() {
  return page.locator("body").ariaSnapshot();
}
async function action(name: string, perform: () => Promise<unknown>) {
  current = name;
  const before = await snapshot();
  const started = Date.now();
  try {
    await perform();
    events.push({
      name,
      result: "pass",
      ms: Date.now() - started,
      before,
      after: await snapshot(),
    });
    console.log(`PASS ${name}`);
  } catch (error) {
    events.push({
      name,
      result: "fail",
      ms: Date.now() - started,
      error: String(error),
      before,
      after: await snapshot(),
    });
    console.log(`FAIL ${name}: ${String(error).slice(0, 240)}`);
  }
  writeFileSync(`${out}/actions.json`, JSON.stringify(events, null, 2));
}
async function click(name: string, locator: Locator) {
  await action(name, () => locator.click());
}
async function fill(name: string, locator: Locator, text: string) {
  await action(name, async () => {
    await locator.fill(text);
    assert.equal(await locator.inputValue(), text);
  });
}
async function shot(name: string) {
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
}
async function settled() {
  await page
    .getByText("Checking access", { exact: true })
    .waitFor({ state: "hidden", timeout: 20000 });
  const skip = page.getByRole("button", { name: "Skip for now", exact: true });
  if (await skip.isVisible()) await click("Dismiss optional onboarding", skip);
}
async function inventory() {
  return page
    .locator("a,button,input,textarea,select,[role=tab],[role=switch],[role=combobox]")
    .evaluateAll((els) =>
      els
        .filter((el) => el.getClientRects().length)
        .map((el) => ({
          tag: el.tagName,
          role: el.getAttribute("role"),
          text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 160),
          id: el.id,
          href: el.getAttribute("href"),
          disabled: el.matches(":disabled") || el.getAttribute("aria-disabled") === "true",
        })),
    );
}
const fixture = {
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  status: "not_checked",
  metadata: {} as Record<string, unknown>,
  loadedInAutoClip: false,
  mediaDownloaded: false,
};
try {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(fixture.url)}&format=json`,
  );
  assert.equal(response.status, 200);
  fixture.metadata = await response.json();
  fixture.status = "metadata_verified";
  const responsePage = await page.goto(`${base}/agent`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  assert.equal(responsePage?.status(), 200);
  await settled();
  await page.getByLabel("Agent message", { exact: true }).waitFor();
  await page.getByText("Crayo key missing", { exact: true }).waitFor({ timeout: 15000 });
  const welcomeSkip = page.getByRole("button", { name: "Skip for now", exact: true });
  await welcomeSkip.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
  if (await welcomeSkip.isVisible()) await click("Dismiss delayed welcome dialog", welcomeSkip);
  await shot("agent-initial");

  // Load the verified source before the command matrix.
  await click(
    "Open AutoClip fixture card",
    page.getByRole("button", { name: "/autoclip", exact: true }),
  );
  await fill(
    "Load verified YouTube URL",
    page.getByLabel("Video URL", { exact: true }),
    fixture.url,
  );
  fixture.loadedInAutoClip = true;
  for (const n of [3, 5, 8, 10, 5]) {
    await click(`Open clip count for ${n}`, page.getByRole("combobox", { name: "How many clips" }));
    await action(`Select ${n} clips`, async () => {
      await page.getByRole("option", { name: `${n} clips`, exact: true }).click();
      assert.match(await page.locator("#card-clip-count").innerText(), new RegExp(`${n} clips`));
    });
  }
  await shot("autoclip-valid-youtube-5-clips");
  for (const [url, expected] of [
    ["not-a-url", "not a valid https URL"],
    ["http://example.com/video.mp4", "only downloads from https"],
    ["https://drive.google.com/file/d/test/view", "share links need a sign-in"],
  ]) {
    await action(`AutoClip validation: ${url}`, async () => {
      await page.getByLabel("Video URL", { exact: true }).fill(url);
      assert.match(await page.locator("#card-long-url-hint").innerText(), new RegExp(expected));
      assert.equal(
        await page.getByLabel("Video URL", { exact: true }).getAttribute("aria-invalid"),
        "true",
      );
      assert.equal(
        await page.getByRole("button", { name: "Cut shorts", exact: true }).isDisabled(),
        true,
      );
    });
  }
  await fill(
    "Restore verified YouTube URL",
    page.getByLabel("Video URL", { exact: true }),
    fixture.url,
  );
  await click(
    "Dismiss fixture card",
    page.getByRole("button", { name: "Dismiss card", exact: true }),
  );

  const args: Record<string, string> = {
    "/short": "A short guide to local software testing",
    "/autoclip": fixture.url,
    "/voice": "This is a local frontend test. No generation is requested.",
    "/voiceover": "This is a local frontend test. No generation is requested.",
    "/image": "A quiet mountain landscape at sunrise",
    "/import": "",
    "/export": "",
    "/ingest": "",
  };
  for (const cmd of AGENT_SLASH_COMMANDS.filter((c) => c.group === "crayo")) {
    await click(`Shortcut ${cmd.cmd}`, page.getByRole("button", { name: cmd.cmd, exact: true }));
    const cardSnapshot = await snapshot();
    await shot(`shortcut-${cmd.cmd.slice(1)}`);
    await click(
      `Dismiss ${cmd.cmd} shortcut`,
      page.getByRole("button", { name: "Dismiss card", exact: true }),
    );
    const input = `${cmd.cmd}${args[cmd.cmd] ? ` ${args[cmd.cmd]}` : ""}`;
    await fill(
      `Compose ${cmd.cmd}: ${input}`,
      page.getByLabel("Agent message", { exact: true }),
      input,
    );
    await action(`Enter ${cmd.cmd}`, async () => {
      await page.getByLabel("Agent message", { exact: true }).press("Enter");
      await page.getByRole("button", { name: "Dismiss card", exact: true }).waitFor();
    });
    if (cmd.ui === "autoclip") {
      await action("Composer preserves YouTube URL", async () =>
        assert.equal(await page.getByLabel("Video URL", { exact: true }).inputValue(), fixture.url),
      );
    }
    if (cmd.ui === "image") {
      for (const ratio of ["16:9", "1:1", "9:16"]) {
        await click(
          `Open image aspect ${ratio}`,
          page.getByRole("combobox", { name: "Aspect", exact: true }),
        );
        await action(`Select image aspect ${ratio}`, async () => {
          await page.getByRole("option", { name: ratio, exact: true }).click();
          assert.equal(await page.locator("#card-aspect").innerText(), ratio);
        });
      }
    }
    if (cmd.ui === "voiceover") {
      await action(`${cmd.cmd} title capped at 25 characters`, async () => {
        await page.locator("#card-vo-title").fill("123456789012345678901234567890");
        assert.equal((await page.locator("#card-vo-title").inputValue()).length, 25);
      });
    }
    const buttons = await page.locator("main button").evaluateAll((els) =>
      els.map((el) => ({
        text: el.textContent?.trim(),
        disabled: (el as HTMLButtonElement).disabled,
      })),
    );
    commands.push({
      command: cmd.cmd,
      shortcutSnapshot: cardSnapshot,
      composerSnapshot: await snapshot(),
      buttons,
      execution: "BLOCKED: Crayo key missing. No generation/import/export/ingest job submitted.",
      input,
    });
    await shot(`composer-${cmd.cmd.slice(1)}`);
    await click(
      `Dismiss ${cmd.cmd} composer card`,
      page.getByRole("button", { name: "Dismiss card", exact: true }),
    );
  }
  for (const name of ["More clipping commands", "More clipping presets", "/clip walkthrough"]) {
    await click(name, page.getByRole("button", { name, exact: true }));
    await shot(name.replace(/[^a-zA-Z0-9]/g, "-"));
    await page.keyboard.press("Escape");
  }

  const nav = await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link")
    .evaluateAll((els) =>
      els.map((el) => ({ label: el.textContent!.trim(), href: el.getAttribute("href")! })),
    );
  for (const item of nav) {
    await action(`Navigate sidebar: ${item.label}`, async () => {
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: item.label, exact: true })
        .click();
      await page.waitForURL(`${base}${item.href}`);
      await settled();
      await page
        .getByRole("heading", { name: item.label, exact: true, level: 1 })
        .waitFor({ timeout: 45000 });
      if (item.href === "/settings")
        await page.locator("#integrations").waitFor({ timeout: 45000 });
    });
    const initial = await snapshot();
    const controls = await inventory();
    const tabs = await page.getByRole("tab").allTextContents();
    for (const tab of tabs) {
      await action(`${item.label} tab: ${tab}`, async () => {
        const target = page.getByRole("tab", { name: tab.trim(), exact: true });
        await target.click();
        assert.equal(await target.getAttribute("aria-selected"), "true");
      });
    }
    await shot(`route-${item.href.slice(1)}`);
    routes.push({
      ...item,
      initialSnapshot: initial,
      finalSnapshot: await snapshot(),
      controls,
      tabs,
    });
    writeFileSync(
      `${out}/partial.json`,
      JSON.stringify({ fixture, events, commands, routes, errors }, null, 2),
    );
  }

  await click(
    "Open notifications",
    page.getByRole("button", { name: "Notifications", exact: true }),
  );
  await action("Dismiss notifications with Escape", () => page.keyboard.press("Escape"));
  const theme = page.getByRole("button", { name: /Switch to (light|dark) mode/ });
  await action("Toggle theme", async () => {
    const label = await theme.getAttribute("aria-label");
    await theme.click();
    assert.notEqual(await theme.getAttribute("aria-label"), label);
  });
  await click("Open account menu", page.getByRole("button", { name: "Account menu for Dev User" }));
  await action("Dismiss account menu", () => page.keyboard.press("Escape"));
  await click(
    "Collapse sidebar",
    page.getByRole("button", { name: "Collapse sidebar", exact: true }),
  );
  await click("Expand sidebar", page.getByRole("button", { name: "Expand sidebar", exact: true }));

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/agent", "/library", "/settings", "/home"]) {
    await action(`Mobile route ${path}`, async () => {
      const r = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
      assert.equal(r?.status(), 200);
      await settled();
      await page.locator("main h1").waitFor({ timeout: 45000 });
      if (path === "/settings") await page.locator("#integrations").waitFor({ timeout: 45000 });
    });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    routes.push({
      href: path,
      viewport: "390x844",
      overflow,
      snapshot: await snapshot(),
      controls: await inventory(),
    });
    await shot(`mobile-${path.slice(1)}`);
  }
} catch (error) {
  events.push({
    name: current,
    result: "fatal",
    error: String(error),
    snapshot: await snapshot().catch(() => ""),
  });
  console.error(error);
  process.exitCode = 1;
} finally {
  const result = {
    base,
    browser: browser.version(),
    completedAt: new Date().toISOString(),
    fixture,
    events,
    commands,
    routes,
    errors,
    limits: [
      "No real Crayo credentials",
      "No paid job submissions",
      "No authentication bypass",
      "No publication/deletion/payment operations",
      "No seeded Crayo project or CDN asset",
    ],
  };
  writeFileSync(`${out}/results.json`, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify({
      output: `${out}/results.json`,
      actions: events.length,
      failed: events.filter((e) => e.result !== "pass").length,
      commands: commands.length,
      routeVisits: routes.length,
      errors: errors.length,
    }),
  );
  if (events.some((e) => e.result !== "pass")) process.exitCode = 1;
  await browser.close();
}
