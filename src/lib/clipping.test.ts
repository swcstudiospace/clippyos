import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyCrayoPage, parseBrowserProcedure } from "./clipping.ts";

test("accepts a well-formed browser procedure", () => {
  const procedure = parseBrowserProcedure({
    kind: "browser-procedure",
    steps: [
      { action: "open_url", url: "https://crayo.io" },
      { action: "wait_for_text", text: "Dashboard", timeoutMs: 5000 },
      { action: "screenshot", continueOnError: true },
      { action: "click", x: 120, y: 80 },
      { action: "type", text: "hello" },
      { action: "key", key: "enter" },
      { action: "scroll", direction: "down", amount: 5 },
      { action: "page_summary" },
    ],
  });
  assert.ok(procedure);
  assert.equal(procedure.kind, "browser-procedure");
  assert.equal(procedure.steps.length, 8);
});

test("rejects non-objects and wrong kind", () => {
  assert.equal(parseBrowserProcedure(null), null);
  assert.equal(parseBrowserProcedure("nope"), null);
  assert.equal(parseBrowserProcedure([]), null);
  assert.equal(parseBrowserProcedure({ steps: [] }), null);
  assert.equal(parseBrowserProcedure({ kind: "python-procedure", steps: [] }), null);
});

test("rejects missing or malformed steps arrays", () => {
  assert.equal(parseBrowserProcedure({ kind: "browser-procedure" }), null);
  assert.equal(parseBrowserProcedure({ kind: "browser-procedure", steps: "open crayo" }), null);
});

test("rejects unknown actions and missing required fields", () => {
  assert.equal(
    parseBrowserProcedure({ kind: "browser-procedure", steps: [{ action: "hover", x: 1 }] }),
    null,
  );
  assert.equal(
    parseBrowserProcedure({ kind: "browser-procedure", steps: [{ action: "open_url" }] }),
    null,
  );
  assert.equal(
    parseBrowserProcedure({ kind: "browser-procedure", steps: [{ action: "click", x: 1 }] }),
    null,
  );
  assert.equal(
    parseBrowserProcedure({ kind: "browser-procedure", steps: [{ action: "key", key: "ctrl+w" }] }),
    null,
  );
  assert.equal(
    parseBrowserProcedure({ kind: "browser-procedure", steps: [{ action: "scroll", direction: "sideways" }] }),
    null,
  );
});

test("rejects non-https open_url steps", () => {
  assert.equal(
    parseBrowserProcedure({ kind: "browser-procedure", steps: [{ action: "open_url", url: "http://crayo.io" }] }),
    null,
  );
  assert.equal(
    parseBrowserProcedure({ kind: "browser-procedure", steps: [{ action: "open_url", url: "javascript:alert(1)" }] }),
    null,
  );
});

test("preserves continueOnError flags on parsed steps", () => {
  const procedure = parseBrowserProcedure({
    kind: "browser-procedure",
    steps: [{ action: "page_summary" }, { action: "type", text: "x", continueOnError: true }],
  });
  assert.ok(procedure);
  assert.equal(procedure.steps[0]?.continueOnError, undefined);
  assert.equal(procedure.steps[1]?.continueOnError, true);
});

test("classifies a login wall from a vision summary", () => {
  assert.equal(classifyCrayoPage("The page shows a Sign in button and Create account link."), "login_wall");
  assert.equal(classifyCrayoPage("Log in to continue. Continue with Google available."), "login_wall");
});

test("classifies an authenticated dashboard", () => {
  assert.equal(classifyCrayoPage("Crayo studio dashboard with the projects list and Log out in the corner."), "logged_in");
});

test("stays unknown when nothing matches", () => {
  assert.equal(classifyCrayoPage(""), "unknown");
  assert.equal(classifyCrayoPage("A blank page with a loading spinner."), "unknown");
});

test("a sign-in footer far into the page does not beat dashboard evidence", () => {
  const summary =
    "Crayo dashboard showing the video projects grid, the remaining credits counter, and the account menu in the top-right corner; a small footer link also mentions sign in.";
  assert.equal(classifyCrayoPage(summary), "logged_in");
});
