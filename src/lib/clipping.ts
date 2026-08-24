/** Client-safe clipping domain types: browser procedures + crayo login classification. */
import { z } from "zod";

export type CrayoLoginState = "unknown" | "logged_in" | "login_wall";

export const BROWSER_KEYS = ["enter", "tab", "escape", "up", "down", "left", "right"] as const;
export type BrowserKey = (typeof BROWSER_KEYS)[number];

const ContinueOnError = z.object({ continueOnError: z.boolean().optional() });

/** Recorded browser procedure steps replayed onto the Social Machine desktop. */
export const BrowserStepSchema = z.discriminatedUnion("action", [
  ContinueOnError.extend({
    action: z.literal("open_url"),
    url: z.string().max(2048).regex(/^https:\/\//i),
  }),
  ContinueOnError.extend({
    action: z.literal("wait_for_text"),
    text: z.string().trim().min(1).max(80),
    timeoutMs: z.number().finite().optional(),
  }),
  ContinueOnError.extend({ action: z.literal("page_summary") }),
  ContinueOnError.extend({ action: z.literal("screenshot") }),
  ContinueOnError.extend({
    action: z.literal("click"),
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  ContinueOnError.extend({
    action: z.literal("type"),
    text: z.string().min(1).max(2000),
  }),
  ContinueOnError.extend({ action: z.literal("key"), key: z.enum(BROWSER_KEYS) }),
  ContinueOnError.extend({
    action: z.literal("scroll"),
    direction: z.enum(["up", "down"]),
    amount: z.number().positive().optional(),
  }),
]);

export type BrowserStep = z.infer<typeof BrowserStepSchema>;

export const BrowserProcedureSchema = z.object({
  kind: z.literal("browser-procedure"),
  steps: z.array(BrowserStepSchema),
});

export interface BrowserProcedure {
  kind: "browser-procedure";
  steps: BrowserStep[];
}

/**
 * Strict guard: a skill row is a browser-procedure skill iff its stored JSON
 * parses through here. Rejects unknown actions, missing fields, non-https URLs.
 */
export function parseBrowserProcedure(value: unknown): BrowserProcedure | null {
  const parsed = BrowserProcedureSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

const CRAYO_LOGIN_WALL_RE = /sign in|log in|log-in|create account|continue with google/i;
const CRAYO_LOGGED_IN_RE = /dashboard|studio|signed in|log out|sign out/i;
/**
 * Classify a vision page summary of crayo.io. The login wall only counts when
 * its phrases appear near the start of the summary — incidental footer links
 * ("Sign in" on an otherwise-authenticated page) must not flip the state.
 */
export function classifyCrayoPage(pageSummaryText: string): CrayoLoginState {
  const text = String(pageSummaryText ?? "");
  if (CRAYO_LOGIN_WALL_RE.test(text.slice(0, 120))) return "login_wall";
  if (CRAYO_LOGGED_IN_RE.test(text)) return "logged_in";
  return "unknown";
}
