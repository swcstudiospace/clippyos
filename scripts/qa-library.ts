import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = "http://127.0.0.1:8080";
const email = `ops.lib.${Date.now()}@agency.test`;
const password = "password123";
const errors: string[] = [];
interface LibraryNotes {
  sidebar?: boolean;
  library?: { heading: boolean; dropzone: boolean; empty: boolean; rendersTab: boolean; importUrl: boolean };
  upload?: { ready: boolean; drawer: boolean };
  settings?: { heading: boolean; stt: boolean; ffmpeg: boolean; testRender: boolean; defaultPreset: boolean };
  mobile?: boolean;
  fatal?: string;
}
const notes: LibraryNotes = {};

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
  await page.getByLabel("Name").fill("Library QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await dismissWelcome();

  const nav = await page.locator("nav").innerText();
  notes.sidebar = /Library/.test(nav);

  await page.goto(base + "/library", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Library" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(800);
  const libBody = await page.locator("body").innerText();
  notes.library = {
    heading: /Library/.test(libBody),
    dropzone: /Drop a clip or image|Choose file/.test(libBody),
    empty: /Library is empty|Upload a clip/.test(libBody),
    rendersTab: /Renders/.test(libBody),
    importUrl: /allowlisted media URL/.test(libBody),
  };
  await page.screenshot({ path: "/workspace/screenshots/qa-library.png", fullPage: true });

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  writeFileSync("/tmp/qa-pixel.png", png);
  await page.locator('input[type="file"]').first().setInputFiles("/tmp/qa-pixel.png");
  await page.getByText(/Ready in Library|Already in the library/).waitFor({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const after = await page.locator("body").innerText();
  notes.upload = {
    ready: /READY/.test(after),
    drawer: /Queue render|Captions|Send to Social/.test(after),
  };
  await page.screenshot({ path: "/workspace/screenshots/qa-library-upload.png", fullPage: true });

  await page.goto(base + "/settings#media", { waitUntil: "domcontentloaded" });
  await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await page.getByRole("heading", { name: "Media pipeline" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(600);
  const settingsBody = await page.locator("body").innerText();
  notes.settings = {
    heading: /Media pipeline/.test(settingsBody),
    stt: /xAI STT|Manual SRT|Transcription/.test(settingsBody),
    ffmpeg: /FFmpeg/.test(settingsBody),
    testRender: /Test render/.test(settingsBody),
    defaultPreset: /Default render preset/.test(settingsBody),
  };
  await page.screenshot({ path: "/workspace/screenshots/qa-settings-media.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/library", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Library" }).waitFor({ timeout: 25000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "/workspace/screenshots/qa-library-mobile.png", fullPage: true });
  notes.mobile = true;
} catch (error) {
  notes.fatal = String(error);
  await page.screenshot({ path: "/workspace/screenshots/qa-library-error.png", fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

console.log(JSON.stringify({ notes, errors: errors.slice(0, 12), errorCount: errors.length }, null, 2));
