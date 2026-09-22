#!/usr/bin/env node
/**
 * Reproduce: Agent tab → YouTube URL → /autoclip → select 5 clips.
 * Writes screenshots + a JSON dump of button/select/network/console state.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const base = process.env.QA_URL || "http://127.0.0.1:8080";
const outDir = "dogfood-output/autoclip-repro";
mkdirSync(outDir, { recursive: true });

const notes: unknown[] = [];
const consoleErrors: string[] = [];
const pageErrors: string[] = [];

function log(entry: unknown) {
  notes.push(entry);
  console.log(typeof entry === "string" ? entry : JSON.stringify(entry, null, 2));
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(25000);
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));

async function shot(name: string) {
  const path = `${outDir}/${name}`;
  await page.screenshot({ path, fullPage: true });
  log(`saved ${name} url=${page.url()}`);
}

async function dumpCutShorts() {
  return page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")].map((el) => ({
      text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
      disabled: el.hasAttribute("disabled") || (el as HTMLButtonElement).disabled,
      ariaDisabled: el.getAttribute("aria-disabled"),
    }));
    const cut = buttons.find((b) => /cut shorts|starting/i.test(b.text));
    const url =
      (document.getElementById("card-long-url") as HTMLInputElement | null)?.value ?? null;
    const clipTrigger = document.getElementById("card-clip-count");
    const badges = [...document.querySelectorAll("*")]
      .filter((el) => /Crayo/.test(el.textContent || "") && (el.textContent || "").length < 40)
      .slice(0, 12)
      .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim());
    return {
      cut,
      url,
      clipTriggerText: clipTrigger?.textContent?.replace(/\s+/g, " ").trim() ?? null,
      badges,
      bodySnippet: (document.body.innerText || "").slice(0, 1500),
    };
  });
}

try {
  await page.goto(`${base}/agent`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page
    .getByRole("button", { name: "Skip for now" })
    .click({ timeout: 4000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: "Expand sidebar" })
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  await shot("01-agent-land.png");
  log({ land: await dumpCutShorts() });

  const agentLink = page.getByRole("link", { name: "Agent", exact: true });
  if (await agentLink.count()) {
    await agentLink.click();
    await page.waitForTimeout(800);
  }
  await shot("02-agent-tab.png");

  const autoclipChip = page.getByRole("button", { name: "/autoclip", exact: true });
  await autoclipChip.waitFor({ timeout: 15000 });
  await autoclipChip.click();
  await page.waitForTimeout(500);
  await shot("03-autoclip-card.png");
  log({ afterChip: await dumpCutShorts() });

  const urlBox = page.getByLabel(/video url/i);
  await urlBox.waitFor();
  await urlBox.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await page.waitForTimeout(400);
  await shot("04-url-filled.png");
  log({ afterUrl: await dumpCutShorts() });

  const clipTrigger = page.locator("#card-clip-count");
  await clipTrigger.click();
  await page.waitForTimeout(400);
  await shot("05-clip-select-open.png");
  const options = await page.getByRole("option").allTextContents();
  log({ options });
  const five = page.getByRole("option", { name: /5 clips/i });
  const fiveCount = await five.count();
  log({ fiveCount });
  if (fiveCount) {
    await five.first().click();
  } else {
    log("NO_FIVE_CLIPS_OPTION");
  }
  await page.waitForTimeout(400);
  await shot("06-after-select-5.png");
  log({ afterSelect: await dumpCutShorts() });

  const cut = page.getByRole("button", { name: /cut shorts|starting/i });
  const cutCount = await cut.count();
  const cutDisabled = cutCount ? await cut.first().isDisabled() : null;
  log({ cutCount, cutDisabled });
  if (cutCount && !cutDisabled) {
    const [response] = await Promise.all([
      page
        .waitForResponse((res) => /agent|start/i.test(res.url()), { timeout: 20000 })
        .catch(() => null),
      cut.first().click(),
    ]);
    log({
      startResponse: response
        ? {
            url: response.url(),
            status: response.status(),
            body: (await response.text()).slice(0, 500),
          }
        : null,
    });
    await page.waitForTimeout(2500);
    await shot("07-after-cut-shorts.png");
    log({ afterCut: await dumpCutShorts() });
    log({ urlAfterCut: page.url() });
  } else if (cutCount && cutDisabled) {
    log("CUT_SHORTS_DISABLED");
    await cut
      .first()
      .click({ force: true })
      .catch(() => {});
    await page.waitForTimeout(800);
    await shot("07-forced-click-disabled.png");
  }

  // Composer path: type slash + URL + Enter
  await page.goto(`${base}/agent`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page
    .getByRole("button", { name: "Skip for now" })
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(800);
  const composer = page.getByLabel("Agent message");
  await composer.waitFor();
  await composer.fill("/autoclip https://youtu.be/dQw4w9WgXcQ");
  await composer.press("Enter");
  await page.waitForTimeout(800);
  await shot("08-composer-enter.png");
  log({ afterComposerEnter: await dumpCutShorts() });

  const clip2 = page.locator("#card-clip-count");
  if (await clip2.count()) {
    await clip2.click();
    const five2 = page.getByRole("option", { name: /5 clips/i });
    if (await five2.count()) await five2.first().click();
    await page.waitForTimeout(400);
    await shot("09-composer-select-5.png");
    log({ afterComposerSelect: await dumpCutShorts() });
  }

  log({ consoleErrors, pageErrors });
  writeFileSync(
    `${outDir}/notes.json`,
    JSON.stringify({ notes, consoleErrors, pageErrors }, null, 2),
  );
} catch (error) {
  log({ error: String(error) });
  await shot("error.png").catch(() => {});
  writeFileSync(
    `${outDir}/notes.json`,
    JSON.stringify({ notes, consoleErrors, pageErrors }, null, 2),
  );
  throw error;
} finally {
  await browser.close();
}
