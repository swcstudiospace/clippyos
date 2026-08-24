import { chromium } from "playwright";
import type { Browser, BrowserContextOptions, Page, Route } from "playwright";
import { mkdirSync, readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

/** The `newContext({ storageState })` payload, as returned by `context.storageState()`. */
type StorageState = NonNullable<BrowserContextOptions["storageState"]>;

const base = "http://127.0.0.1:8080";
const outDir = "/workspace/public/marketing";
const videoRoot = "/tmp/mkt-videos";
mkdirSync(outDir, { recursive: true });
mkdirSync(videoRoot, { recursive: true });

const email = `ops.photo.${Date.now()}@studio.test`;
const password = "password123";
const VIEW = { width: 1280, height: 720 };
const LOAD_MS = 20000;
const HOLD_MS = 4200;

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

function toGif(webm: string, gifPath: string, startSec: number, duration = 4.2) {
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

function findWebm(dir: string) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith(".webm"));
  if (!files.length) return null;
  return join(dir, files[0]);
}

function stillFromWebm(webm: string, jpg: string, ss: number) {
  spawnSync("ffmpeg", ["-y", "-ss", String(ss), "-i", webm, "-frames:v", "1", "-q:v", "4", jpg], {
    encoding: "utf8",
  });
}

async function dismiss(page: Page) {
  const skip = page.getByRole("button", { name: /Skip for now|I’ll do this later|I'll do this later/i });
  if (await skip.first().isVisible().catch(() => false)) await skip.first().click();
  const closeDlg = page.getByRole("button", { name: "Close" });
  if (await closeDlg.isVisible().catch(() => false)) await closeDlg.click();
}

async function themeContext(browser: Browser, storageState: StorageState, theme: "dark" | "light", dir: string) {
  const ctx = await browser.newContext({
    viewport: VIEW,
    screen: VIEW,
    deviceScaleFactor: 1,
    colorScheme: theme,
    recordVideo: { dir, size: VIEW },
    storageState,
  });
  await ctx.addInitScript((next: string) => {
    const apply = () => {
      const root = document.documentElement;
      if (!root) return;
      root.setAttribute("data-theme", next);
      root.style.colorScheme = next;
    };
    try {
      localStorage.setItem("clippy-os-theme", next);
    } catch {
      /* ignore */
    }
    apply();
  }, theme);
  return ctx;
}

const inboxWebm = findWebm(join(videoRoot, "inbox-dark"));
if (inboxWebm && !existsSync(join(outDir, "inbox-dark.gif"))) {
  toGif(inboxWebm, join(outDir, "inbox-dark.gif"), 22, 4.2);
  stillFromWebm(inboxWebm, join(outDir, "inbox-dark.jpg"), 22);
  console.log("converted leftover inbox-dark");
}

for (const name of []) {
  const webm = findWebm(join(videoRoot, `${name}-dark`));
  if (!webm) continue;
  toGif(webm, join(outDir, `${name}-dark.gif`), 22, 4.2);
  console.log("re-encoded", name, "dark @960");
}

const browser = await chromium.launch({ headless: true });
const boot = await browser.newContext({ viewport: VIEW, colorScheme: "light" });
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
await page.waitForTimeout(800);
await dismiss(page);
await page.goto(base + "/home", { waitUntil: "domcontentloaded" });
await page.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
await dismiss(page);
try {
  const add = page.getByRole("button", { name: "Add Client" }).first();
  if (await add.isVisible().catch(() => false)) {
    await add.click();
    const manual = page.getByRole("button", { name: /Enter details manually/i });
    if (await manual.isVisible().catch(() => false)) await manual.click();
    const name = page.getByLabel("Name");
    if (await name.isVisible().catch(() => false)) {
      await name.fill("Northstar Media");
      await page.getByRole("button", { name: /Save client|^Save$/i }).last().click();
      await page.waitForTimeout(600);
    }
  }
} catch {
  /* seed optional */
}
const storageState = await boot.storageState();
await boot.close();

for (const theme of ["dark", "light"] as const) {
  const dir = join(videoRoot, `splash-${theme}-v2`);
  mkdirSync(dir, { recursive: true });
  const ctx = await themeContext(browser, storageState, theme, dir);
  const cap = await ctx.newPage();
  cap.setDefaultTimeout(40000);
  await cap.route("**/*", async (route: Route) => {
    const type = route.request().resourceType();
    const url = route.request().url();
    const skip =
      /better-auth|get-session|\/api\/auth|session/i.test(url) ||
      type === "document" ||
      type === "stylesheet" ||
      type === "script" ||
      type === "font" ||
      type === "image";
    if ((type === "fetch" || type === "xhr") && !skip) {
      await new Promise((resolve) => setTimeout(resolve, 9000));
    }
    await route.continue();
  });
  await cap.goto(base + "/home", { waitUntil: "domcontentloaded" });
  await cap.getByText(/Checking access|Loading your workspace|^Loading$/i).first().waitFor({ timeout: 12000 }).catch(() => {});
  await cap.waitForTimeout(6500);
  const jpg = join(outDir, `splash-${theme}.jpg`);
  await cap.screenshot({ path: jpg, type: "jpeg", quality: 78, fullPage: false });
  await cap.waitForTimeout(1200);
  await ctx.close();
  const webm = findWebm(dir);
  if (webm) {
    toGif(webm, join(outDir, `splash-${theme}.gif`), 0.9, 3.55);
    console.log("captured splash", theme);
  } else {
    console.log("NO VIDEO splash", theme);
  }
}

const jobs: { name: string; path: string; ready: RegExp; theme: "dark" | "light" }[] = [
  { name: "inbox", path: "/inbox", ready: /Inbox|Telegram|WhatsApp/i, theme: "dark" },
  ...shots.map((shot) => ({ ...shot, theme: "light" as const })),
];

for (const shot of jobs) {
  const theme = shot.theme;
  const dir = join(videoRoot, `${shot.name}-${theme}-v2`);
  mkdirSync(dir, { recursive: true });
  const ctx = await themeContext(browser, storageState, theme, dir);
  const cap = await ctx.newPage();
  cap.setDefaultTimeout(40000);
  const started = Date.now();
  await cap.goto(base + shot.path, { waitUntil: "domcontentloaded" });
  await cap.getByText("Checking access", { exact: false }).waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
  await cap.waitForTimeout(500);
  await dismiss(cap);
  await cap.getByText(shot.ready).first().waitFor({ timeout: 20000 }).catch(() => {});
  await cap.waitForTimeout(LOAD_MS);
  await dismiss(cap);
  const jpg = join(outDir, `${shot.name}-${theme}.jpg`);
  await cap.screenshot({ path: jpg, type: "jpeg", quality: 78, fullPage: false });
  await cap.waitForTimeout(HOLD_MS);
  const elapsed = (Date.now() - started) / 1000;
  const startSec = Math.max(1, elapsed - HOLD_MS / 1000 - 0.35);
  await ctx.close();
  const webm = findWebm(dir);
  if (!webm) {
    console.log("NO VIDEO", shot.name, theme);
    continue;
  }
  toGif(webm, join(outDir, `${shot.name}-${theme}.gif`), startSec, 4.2);
  console.log("captured", shot.name, theme, `ss=${startSec.toFixed(1)}`);
}

await browser.close();
console.log("resume done");
