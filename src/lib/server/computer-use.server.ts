/**
 * Daytona Computer Use primitives. Never returns VNC passwords or the Daytona key.
 * Start/stop respect Social Machine lifecycle — never implied by other calls.
 */
import {
  getRunningSocialSandbox,
  getSocialMachineStatus,
  listSocialWindows,
  sanitizeDaytonaError,
  startSocialMachine,
  stopSocialMachine,
  takeSocialScreenshot,
} from "@/lib/server/daytona.server";

export type ComputerPoint = { x: number; y: number };

function asPoint(raw: unknown): ComputerPoint {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const x = Number(row.x ?? row[0]);
  const y = Number(row.y ?? row[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("VALIDATION");
  return { x: Math.round(x), y: Math.round(y) };
}

async function computer() {
  const { sandbox } = await getRunningSocialSandbox();
  try {
    await sandbox.computerUse.start();
  } catch {
    /* already running */
  }
  return sandbox.computerUse;
}

export async function computerStart() {
  return startSocialMachine();
}

export async function computerStop() {
  return stopSocialMachine();
}

export async function computerScreenshot() {
  return takeSocialScreenshot();
}

export async function computerListWindows() {
  return listSocialWindows();
}

export async function computerMouseClick(input: {
  x?: unknown;
  y?: unknown;
  button?: unknown;
}) {
  const cu = await computer();
  const x = Number(input.x);
  const y = Number(input.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("VALIDATION");
  const button = String(input.button ?? "left");
  try {
    if (cu.mouse?.click) await cu.mouse.click(x, y, button);
    else if (cu.mouseClick) await cu.mouseClick(x, y);
    else throw new Error("COMPUTER_USE_UNAVAILABLE");
  } catch (error) {
    throw new Error(sanitizeDaytonaError(error instanceof Error ? error.message : "COMPUTER_USE_UNAVAILABLE"));
  }
  return { ok: true as const, x, y, button };
}

export async function computerMouseMove(input: { x?: unknown; y?: unknown }) {
  const cu = await computer();
  const x = Number(input.x);
  const y = Number(input.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("VALIDATION");
  try {
    if (cu.mouse?.move) await cu.mouse.move(x, y);
    else if (cu.mouseMove) await cu.mouseMove(x, y);
    else throw new Error("COMPUTER_USE_UNAVAILABLE");
  } catch (error) {
    throw new Error(sanitizeDaytonaError(error instanceof Error ? error.message : "COMPUTER_USE_UNAVAILABLE"));
  }
  return { ok: true as const, x, y };
}

export async function computerMouseDrag(input: { from?: unknown; to?: unknown }) {
  const cu = await computer();
  const from = asPoint(input.from);
  const to = asPoint(input.to);
  try {
    if (cu.mouse?.drag) await cu.mouse.drag(from.x, from.y, to.x, to.y);
    else if (cu.mouseDrag) await cu.mouseDrag(from, to);
    else throw new Error("COMPUTER_USE_UNAVAILABLE");
  } catch (error) {
    throw new Error(sanitizeDaytonaError(error instanceof Error ? error.message : "COMPUTER_USE_UNAVAILABLE"));
  }
  return { ok: true as const, from, to };
}

export async function computerMouseScroll(input: { x?: unknown; y?: unknown; dy?: unknown }) {
  const cu = await computer();
  const x = Number(input.x ?? 0);
  const y = Number(input.y ?? 0);
  const dy = Number(input.dy ?? 0);
  try {
    if (cu.mouse?.scroll) await cu.mouse.scroll(x, y, dy);
    else if (cu.mouseScroll) await cu.mouseScroll(dy);
    else throw new Error("COMPUTER_USE_UNAVAILABLE");
  } catch (error) {
    throw new Error(sanitizeDaytonaError(error instanceof Error ? error.message : "COMPUTER_USE_UNAVAILABLE"));
  }
  return { ok: true as const, x, y, dy };
}

export async function computerKeyboardType(input: { text?: unknown }) {
  const cu = await computer();
  const text = String(input.text ?? "").slice(0, 400);
  if (!text) throw new Error("VALIDATION");
  try {
    if (cu.keyboard?.type) await cu.keyboard.type(text);
    else if (cu.type) await cu.type(text);
    else throw new Error("COMPUTER_USE_UNAVAILABLE");
  } catch (error) {
    throw new Error(sanitizeDaytonaError(error instanceof Error ? error.message : "COMPUTER_USE_UNAVAILABLE"));
  }
  return { ok: true as const, length: text.length };
}

export async function computerKeyboardKey(input: { key?: unknown; keys?: unknown }) {
  const cu = await computer();
  const keys = Array.isArray(input.keys)
    ? input.keys.map(String)
    : String(input.key ?? "")
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean);
  if (!keys.length) throw new Error("VALIDATION");
  try {
    if (cu.keyboard?.hotkey) await cu.keyboard.hotkey(keys);
    else if (cu.keyboard?.press) await cu.keyboard.press(keys.join("+"));
    else if (cu.hotkey) await cu.hotkey(keys);
    else throw new Error("COMPUTER_USE_UNAVAILABLE");
  } catch (error) {
    throw new Error(sanitizeDaytonaError(error instanceof Error ? error.message : "COMPUTER_USE_UNAVAILABLE"));
  }
  return { ok: true as const, keys };
}

export async function computerAccessibilityFind(input: { role?: unknown; name?: unknown }) {
  const cu = await computer();
  const role = typeof input.role === "string" ? input.role : undefined;
  const name = typeof input.name === "string" ? input.name : undefined;
  try {
    if (cu.accessibility?.find) {
      const nodes = await cu.accessibility.find({ role, name });
      return { nodes: Array.isArray(nodes) ? nodes.slice(0, 20) : nodes };
    }
    const shot = await takeSocialScreenshot();
    return {
      nodes: [],
      note: "Accessibility tree unavailable; use computer.screenshot + vision.analyze.",
      screenshotRef: shot.screenshotRef,
    };
  } catch {
    return {
      nodes: [],
      note: "Accessibility tree unavailable on this desktop.",
    };
  }
}

export async function computerStatus() {
  const machine = await getSocialMachineStatus();
  return {
    state: machine.state,
    computerUse: machine.computerUse,
    sandboxId: machine.sandboxId ? "set" : null,
  };
}
