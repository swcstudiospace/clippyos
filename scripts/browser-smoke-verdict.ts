import { createHash } from "node:crypto";

/** One viewport's observations, as persisted in verdict JSON and read back from prior runs' baselines. */
export type ViewportResult = {
  width?: number;
  height?: number;
  status?: number;
  title?: string;
  hasCanvas?: boolean;
  bodyTextLen?: number;
  bodyTextHash?: string;
  bodyTextPrefix?: string;
  horizontalOverflow?: boolean;
  consoleErrors?: string[];
  pageErrors?: string[];
  screenshot?: string;
};

/** The verdict object browser-smoke.ts writes on success. */
export type Verdict = {
  url: string;
  viewports: Record<string, ViewportResult>;
  brandWarnings: string[];
  authWarnings: string[];
  verdictFile: string;
};

/** Comparison input: a full or partial verdict; null/undefined covers degenerate baselines. */
export type VerdictLike = { viewports?: Record<string, ViewportResult> };

export type BaselineComparison = { divergesFromBaseline: boolean; reasons: string[] };

export function normalizeBodyText(text: unknown): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizedBodyTextHash(text: unknown): string {
  return createHash("sha256").update(normalizeBodyText(text)).digest("hex");
}

const IDENTITY_PREFIX_LEN = 64;

export function bodyTextPrefix(text: unknown): string {
  return normalizeBodyText(text).slice(0, IDENTITY_PREFIX_LEN);
}
/** Success carries the resolved paths; failure carries only `error` — never both. */
export type ParsedSmokeArgs =
  | { url: string; outPng: string; baseline: string; error?: undefined }
  | { url?: undefined; outPng?: undefined; baseline?: undefined; error: string };

export function parseSmokeArgs(
  argv: string[],
  env: Record<string, string | undefined> = {},
): ParsedSmokeArgs {
  const positional: string[] = [];
  let baseline = env.BROWSER_SMOKE_BASELINE || "";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--baseline") {
      const value = argv[++i];
      if (!value) return { error: "--baseline requires a path to a prior verdict JSON" };
      baseline = value;
    } else if (arg.startsWith("--baseline=")) {
      const value = arg.slice("--baseline=".length);
      if (!value) return { error: "--baseline requires a path to a prior verdict JSON" };
      baseline = value;
    } else if (arg.startsWith("--")) {
      return { error: `unknown flag: ${arg}` };
    } else {
      positional.push(arg);
    }
  }
  return {
    url: positional[0] || "http://127.0.0.1:8080/",
    outPng: positional[1] || "/workspace/screenshots/app-builder-preview.png",
    baseline,
  };
}
export function derivedPaths(outPng: string): { mobilePng: string; verdictJson: string } {
  const base = outPng.replace(/\.png$/i, "");
  return { mobilePng: `${base}-mobile.png`, verdictJson: `${base}.json` };
}

const TRIVIAL_LEN_DELTA = 20;
const TRIVIAL_LEN_RATIO = 0.1;
const COLLAPSE_RATIO = 0.5;
export function compareToBaseline(
  current: VerdictLike | null | undefined,
  baseline: VerdictLike | null | undefined,
): BaselineComparison {
  const entries = Object.entries(current?.viewports ?? {});
  if (entries.length === 0) {
    return {
      divergesFromBaseline: true,
      reasons: ["current verdict has no viewport data"],
    };
  }
  const reasons: string[] = [];
  const baseViewports = baseline?.viewports ?? {};
  for (const [name, cur] of entries) {
    const base = baseViewports[name];
    if (!base) {
      reasons.push(`${name}: no baseline data for this viewport`);
      continue;
    }
    if (cur.status !== base.status) {
      reasons.push(`${name}: HTTP status changed ${base.status} -> ${cur.status}`);
    }
    if (base.title !== undefined && cur.title !== undefined && cur.title !== base.title) {
      reasons.push(`${name}: title changed ("${base.title}" -> "${cur.title}")`);
    }
    if (base.hasCanvas && !cur.hasCanvas) {
      reasons.push(`${name}: canvas disappeared`);
    }
    if (cur.horizontalOverflow && !base.horizontalOverflow) {
      reasons.push(`${name}: horizontal overflow appeared`);
    }
    const baseErrs = (base.consoleErrors?.length ?? 0) + (base.pageErrors?.length ?? 0);
    const curErrs = (cur.consoleErrors?.length ?? 0) + (cur.pageErrors?.length ?? 0);
    if (curErrs > 0 && baseErrs === 0) {
      reasons.push(`${name}: console/page errors appeared (${curErrs})`);
    }
    const baseLen = base.bodyTextLen ?? 0;
    const curLen = cur.bodyTextLen ?? 0;
    if (baseLen > 0 && curLen < baseLen * COLLAPSE_RATIO) {
      reasons.push(`${name}: body text collapsed (${baseLen} -> ${curLen} chars)`);
    } else if (cur.bodyTextHash !== base.bodyTextHash) {
      if (Math.abs(curLen - baseLen) > Math.max(TRIVIAL_LEN_DELTA, baseLen * TRIVIAL_LEN_RATIO)) {
        reasons.push(`${name}: body text changed (${baseLen} -> ${curLen} chars, hash mismatch)`);
      } else if (
        base.bodyTextPrefix !== undefined &&
        cur.bodyTextPrefix !== undefined &&
        cur.bodyTextPrefix !== base.bodyTextPrefix
      ) {
        reasons.push(`${name}: body text replaced (similar length, page start changed)`);
      }
    }
  }
  return { divergesFromBaseline: reasons.length > 0, reasons };
}
/** Structural gate on JSON.parse output: a non-array object whose `viewports` is a non-array object. */
function verdictViewports(value: unknown): Record<string, ViewportResult> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  if (!("viewports" in value)) return null;
  const viewports: unknown = value.viewports;
  if (viewports === null || typeof viewports !== "object" || Array.isArray(viewports)) return null;
  // Field-level shapes are trusted from prior runs of this script, exactly as before typing.
  return viewports as Record<string, ViewportResult>;
}

export function baselineComparison(
  current: VerdictLike | null | undefined,
  rawText: string,
): BaselineComparison {
  let baseline: unknown;
  try {
    baseline = JSON.parse(rawText);
  } catch {
    return { divergesFromBaseline: true, reasons: ["baseline unreadable: invalid JSON"] };
  }
  const viewports = verdictViewports(baseline);
  if (!viewports) {
    return { divergesFromBaseline: true, reasons: ["baseline unreadable: not a verdict object"] };
  }
  return compareToBaseline(current, { viewports });
}
export function exitCodeFor(viewports?: Record<string, ViewportResult> | null): number {
  const list = Object.values(viewports ?? {});
  if (list.length === 0) return 1;
  if (list.some((v) => (v.status ?? 0) >= 400 || (v.status ?? 0) === 0)) return 1;
  if (list.some((v) => (v.consoleErrors?.length ?? 0) > 0 || (v.pageErrors?.length ?? 0) > 0)) {
    return 2;
  }
  return 0;
}

// Platform chrome mandates the grok.com extensions.js tag in every page head
// (scripts/grok-pwa-shared.ts, GROK_EXTENSIONS_SCRIPT_SRC), and grok.com serves
// it with `Cross-Origin-Resource-Policy: same-origin` plus `COEP: require-corp`,
// so Chromium deterministically refuses to run it cross-origin. That block is
// expected chrome behavior, not an app defect — the smoke gate ignores exactly
// this error and still fails on every other console/page error.
export const GROK_EXTENSIONS_SCRIPT_URL =
  "https://grok.com/grok-app-builder/extensions.js";

export function isExpectedPlatformChromeBlock(errorText: string, sourceUrl: string): boolean {
  return (
    errorText.includes("ERR_BLOCKED_BY_RESPONSE") && sourceUrl === GROK_EXTENSIONS_SCRIPT_URL
  );
}
