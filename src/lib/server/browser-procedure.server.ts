/**
 * Browser-procedure executor: replays a recorded BrowserProcedure onto the
 * Social Machine through the existing browser-use / computer-use primitives.
 * Never starts a stopped VM — every primitive throws MACHINE_STOPPED itself.
 * Every run writes one audit entry; step details never carry secrets.
 */
import { parseBrowserProcedure, type BrowserStep } from "@/lib/clipping";
import {
  browserGetPageSummary,
  browserOpenUrl,
  browserWaitForText,
} from "@/lib/server/browser-use.server";
import { sanitizeDaytonaError } from "@/lib/server/daytona.server";
import {
  computerKeyboardKey,
  computerKeyboardType,
  computerMouseClick,
  computerMouseScroll,
  computerScreenshot,
} from "@/lib/server/computer-use.server";
import { writeAuditLog } from "@/lib/server/autonomy-audit.server";

export type BrowserStepResult = { action: string; ok: boolean; detail: string };

export type ExecuteBrowserProcedureResult = {
  ok: boolean;
  skillSlug: string | null;
  steps: number;
  results: BrowserStepResult[];
};

export type BrowserProcedureRunContext = {
  requestId: string;
  actor: { source: "api" | "mcp" | "webhook"; keyId: string | null; label: string };
  skillSlug?: string | null;
  /** Wall-clock budget for the whole procedure. Default 180s, min 1s. */
  timeoutMs?: number;
};

const DEFAULT_PROCEDURE_TIMEOUT_MS = 180_000;

async function runBrowserStep(step: BrowserStep): Promise<BrowserStepResult> {
  try {
    switch (step.action) {
      case "open_url": {
        await browserOpenUrl({ url: step.url });
        return { action: step.action, ok: true, detail: `opened ${step.url}` };
      }
      case "wait_for_text": {
        const found = await browserWaitForText({ text: step.text, timeoutMs: step.timeoutMs });
        return {
          action: step.action,
          ok: found.found === true,
          detail: found.found ? `found ${JSON.stringify(step.text)}` : `text not seen before timeout`,
        };
      }
      case "page_summary": {
        const summary = await browserGetPageSummary();
        return { action: step.action, ok: true, detail: String(summary.summary).slice(0, 400) };
      }
      case "screenshot": {
        const shot = await computerScreenshot();
        return { action: step.action, ok: true, detail: shot.screenshotRef };
      }
      case "click": {
        await computerMouseClick({ x: step.x, y: step.y });
        return { action: step.action, ok: true, detail: `clicked ${step.x},${step.y}` };
      }
      case "type": {
        await computerKeyboardType({ text: step.text });
        return { action: step.action, ok: true, detail: `typed ${step.text.length} chars` };
      }
      case "key": {
        await computerKeyboardKey({ key: step.key });
        return { action: step.action, ok: true, detail: `pressed ${step.key}` };
      }
      case "scroll": {
        const dy = (step.amount ?? 5) * (step.direction === "up" ? -1 : 1);
        await computerMouseScroll({ dy });
        return { action: step.action, ok: true, detail: `scrolled ${step.direction} by ${Math.abs(dy)}` };
      }
    }
  } catch (error) {
    return {
      action: step.action,
      ok: false,
      // sanitizeDaytonaError scrubs Daytona keys/proxy credentials from messages.
      detail: sanitizeDaytonaError(error instanceof Error ? error.message : "STEP_FAILED"),
    };
  }
}

/**
 * Execute procedure steps sequentially. Halts on the first failing step unless
 * that step set continueOnError; the overall result is ok only when no step
 * failed. Throws VALIDATION when the input is not a parseable procedure.
 */
export async function executeBrowserProcedure(
  procedure: unknown,
  context: BrowserProcedureRunContext,
): Promise<ExecuteBrowserProcedureResult> {
  const parsed = parseBrowserProcedure(procedure);
  if (!parsed) throw new Error("VALIDATION");
  const deadline = Date.now() + Math.max(context.timeoutMs ?? DEFAULT_PROCEDURE_TIMEOUT_MS, 1000);
  const results: BrowserStepResult[] = [];
  let ok = true;
  for (const step of parsed.steps) {
    if (Date.now() > deadline) {
      results.push({ action: step.action, ok: false, detail: "PROCEDURE_TIMEOUT" });
      ok = false;
      break;
    }
    const result = await runBrowserStep(step);
    results.push(result);
    if (!result.ok) {
      ok = false;
      if (!step.continueOnError) break;
    }
  }
  const lastFailure = [...results].reverse().find((row) => !row.ok);
  try {
    await writeAuditLog({
      requestId: context.requestId,
      actor: context.actor,
      action: "clipping.run_browser_procedure",
      entityType: "skill",
      entityId: context.skillSlug ?? null,
      result: ok ? "ok" : "error",
      errorCode: ok ? null : (lastFailure?.detail ?? "STEP_FAILED"),
    });
  } catch {
    /* audit is best-effort — never mask the run outcome */
  }
  return { ok, skillSlug: context.skillSlug ?? null, steps: parsed.steps.length, results };
}
