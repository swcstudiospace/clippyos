/**
 * Full-bleed 16:9 marketing GIFs.
 * Viewport === video size (no letterbox). 20s settle. Dark + light.
 * Hero splash holds by delaying billing only. Inbox + Social are captured
 * once each for their landing sections, not the product grid.
 */
import { chromium } from "playwright";
import { mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const base = "http://127.0.0.1:8080";
const outDir = "/workspace/public/marketing";
const videoRoot = "/tmp/mkt-videos";
mkdirSync(outDir, { recursive: true });
rmSync(videoRoot, { recursive: true, force: true });
mkdirSync(videoRoot, { recursive: true });

const email = `ops.photo.${Date.now()}@studio.test`;
const password = "password123";
const VIEW = { width: 1280, height: 720 };
const LOAD_MS = 20000;
const HOLD_MS = 4200;
const THEMES = ["dark", "light"];

const shots = [
  { name: "command", path: "/home", ready: /Dashboard|Total MRR|Pipeline|Daily/i },
  { name: "money", path: "/money", ready: /Money|Retainer|Revenue|MRR/i },
  { name: "clients", path: "/clients", ready: /Clients/i },
  { name: "ideation", path: "/ideation", ready: /Ideation|Brief|Thread/i },
  { name: "agent", path: "/agent", ready: /Agent|Clippy|Run/i },
  { name: "library", path: "/library", ready: /Library|Assets|Upload/i },
  { name: "approvals", path: "/approvals", ready: /Approvals/i },
  { name: "settings", path: "/settings", ready: /Settings|Add-ons|Integrations/i },
  { name: "social", path: "/social", ready: /Social/i },
  { name: "inbox", path: "/inbox", ready: /Inbox|Telegram|WhatsApp/i },
];

function toGif(webm, gifPath, startSec, duration = 4.2) {
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      String(Math.max(0, startSec).toFixed(2)),
      "-t",
      String(duration),
      "-i",
      webm,
      "-vf",
      "fps=8,scale=960:540:force_original_aspect_ratio=increase,crop=960:540,setsar=1,split[s0][s1];[s0]palettegen=stats_mode=diff:max_colors=80[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
      "-loop",
      "0",
      gifPath,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stderr?.slice(-800));
    throw new Error(`ffmpeg gif failed for ${webm}`);
  }
}

function findWebm(dir) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith(".webm"));
  return files.length ? join(dir, files[0]) : null;
}

async function dismiss(page) {
  const skip = page.getByRole("button", { name: /Skip for now|I’ll do this later|I'll do this later/i });
  if (await skip.first().isEnabled().catch(() => false)) {
    await skip.first().click({ timeout: 2000 }).catch(() => {});
  }
  const closeDlg = page.getByRole("button", { name: "Close" });
  if (await closeDlg.isEnabled().catch(() => false)) {
    await closeDlg.click({ timeout: 1500 }).catch(() => {});
  }
}

async function themeContext(browser, storageState, theme, dir) {
  const ctx = await browser.newContext({
    viewport: VIEW,
    screen: VIEW,
    deviceScaleFactor: 1,
    colorScheme: theme,
    recordVideo: { dir, size: VIEW },
    storageState,
  });
  await ctx.addInitScript((next) => {
    const root = document.documentElement;
    if (root) {
      root.setAttribute("data-theme", next);
      root.style.colorScheme = next;
    }
    try {
      localStorage.setItem("clippy-os-theme", next);
    } catch {
      /* ignore */
    }
  }, theme);
  return ctx;
}

const browser = await chromium.launch({ headless: true });
const boot = await browser.newContext({ viewport: VIEW, colorScheme: "dark" });
const page = await boot.newPage();
page.setDefaultTimeout(45000);
await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /Need an account\? Create one/i }).click();
await page.getByLabel("Name").fill("Studio North");
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill(password);
await page.getByRole("button", { name: /Continue to checkout|Create account|Sign up/i }).click();
await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 28000 });
await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
await dismiss(page);
const storageState = await boot.storageState();
await boot.close();

for (const theme of THEMES) {
  const dir = join(videoRoot, `splash-${theme}`);
  mkdirSync(dir, { recursive: true });
  const ctx = await themeContext(browser, storageState, theme, dir);
  const cap = await ctx.newPage();
  await cap.route("**/*", async (route) => {
    const url = route.request().url();
    const type = route.request().resourceType();
    if ((type === "fetch" || type === "xhr") && /billing/i.test(url)) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
    await route.continue();
  });
  await cap.goto(base + "/home", { waitUntil: "domcontentloaded" });
  await cap.getByText(/Checking access|Loading your workspace|^Loading$/i).first().waitFor({ timeout: 15000 }).catch(() => {});
  await cap.waitForTimeout(7000);
  await cap.screenshot({ path: join(outDir, `splash-${theme}.jpg`), type: "jpeg", quality: 78, fullPage: false });
  await cap.waitForTimeout(1200);
  await ctx.close();
  const webm = findWebm(dir);
  if (webm) toGif(webm, join(outDir, `splash-${theme}.gif`), 0.9, 3.55);
  console.log("captured splash", theme);
}

for (const theme of THEMES) {
  for (const shot of shots) {
    const dir = join(videoRoot, `${shot.name}-${theme}`);
    mkdirSync(dir, { recursive: true });
    const ctx = await themeContext(browser, storageState, theme, dir);
    const cap = await ctx.newPage();
    const started = Date.now();
    await cap.goto(base + shot.path, { waitUntil: "domcontentloaded" });
    await cap.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
    await dismiss(cap);
    await cap.getByText(shot.ready).first().waitFor({ timeout: 20000 }).catch(() => {});
    await cap.waitForTimeout(LOAD_MS);
    await dismiss(cap);
    await cap.screenshot({ path: join(outDir, `${shot.name}-${theme}.jpg`), type: "jpeg", quality: 78, fullPage: false });
    await cap.waitForTimeout(HOLD_MS);
    const startSec = Math.max(1, (Date.now() - started) / 1000 - HOLD_MS / 1000 - 0.35);
    await ctx.close();
    const webm = findWebm(dir);
    if (webm) toGif(webm, join(outDir, `${shot.name}-${theme}.gif`), startSec, 4.2);
    console.log("captured", shot.name, theme);
  }
}

await browser.close();
console.log("done");
