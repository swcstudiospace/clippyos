# ClippyOS Frontend Dogfood And Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exercise ClippyOS operator, public, login, and portal surfaces in a real browser with test data, fix confirmed product bugs, re-verify, and write a findings report.

**Architecture:** Chrome DevTools MCP drives `http://127.0.0.1:8080` (dev via `npm run dev` only). Defects are logged with evidence, then patched in the smallest source files that own the behavior. No paid jobs, VM starts, publishes, payments, or migrations.

**Tech Stack:** TanStack Start, React, Chrome DevTools MCP, Node built-in test runner, Playwright QA scripts already in `scripts/qa-*.ts`.

**Spec:** `AGENTS.md` (operator OS contracts) plus `docs/2026-09-18-localhost-frontend-test-report.md` (prior pass, defects F-01–F-04).

## Global Constraints

- Start the app only with `npm run dev` (port `0.0.0.0:8080`, `strictPort`). Never invoke `vite` directly.
- Do not commit `.env`. Do not invent credentials. `VITE_AUTH_ENABLED` in `.grok/app-env.json` is currently `"false"` — Dev User preview is the expected operator identity.
- Do not start the Social Machine / Daytona VM, publish social posts, mark invoices paid, charge cards, or apply `db:migrate` unless an existing test already requires it.
- Do not modify platform chrome: `server/middleware/grok-pwa.ts`, `grokPwaPlugin()`.
- Server-only modules stay in `src/lib/server/**` and `*.server.ts`.
- Tests: `node --experimental-strip-types --test <file>` for a single file; `npm test` before a task commit; `npm run typecheck` when TSX/routes change.
- Evidence lives in `dogfood-output/sdd-2026-09-18/` (screenshots + `findings.jsonl`). Report path: `docs/2026-09-18-sdd-frontend-dogfood-report.md`.
- Test media URL (already verified oEmbed): `https://www.youtube.com/watch?v=dQw4w9WgXcQ`.
- Test client name: `Dogfood QA Client`. Test lead name: `Dogfood QA Lead`.
- CSP blocks of `https://grok.com/grok-app-builder/extensions.js` are expected platform noise, not product bugs (`scripts/browser-smoke-verdict.ts`).
- Commit after each task that changes source; message style `fix(ui):` / `docs:` / `test:`.

---

## File structure

| File                                             | Responsibility                                |
| ------------------------------------------------ | --------------------------------------------- |
| `src/components/agent/tool-cards.tsx`            | Voice card pending/skeleton; Crayo setup copy |
| `src/routes/_app/agent.tsx`                      | Agent banner Crayo setup copy                 |
| `dogfood-output/sdd-2026-09-18/`                 | Screenshots and findings log                  |
| `docs/2026-09-18-sdd-frontend-dogfood-report.md` | Final report                                  |

---

### Task 1: Prove localhost and Chrome load the real UI

**Files:**

- Create: `dogfood-output/sdd-2026-09-18/task-1-load.md`
- Create: `dogfood-output/sdd-2026-09-18/screenshots/` (directory)

**Interfaces:**

- Consumes: none
- Produces: confirmed origin `http://127.0.0.1:8080` returning HTML (not Vite 500) for `/` and `/home`; Chrome DevTools `pageId` recorded in `task-1-load.md`

- [ ] **Step 1: Confirm or start the dev server**

If `ss -tlnp | grep 8080` is empty, from `/root/src/repos/clippyos` run `npm run dev` in the background. Wait until `curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/home` is `200` (retry after 500 during first compile; one restart is allowed, matching F-01).

- [ ] **Step 2: Open Chrome DevTools on the origin**

Use MCP `chrome-devtools__list_pages`, then `chrome-devtools__new_page` or `navigate_page` to `http://127.0.0.1:8080/home`. Take a snapshot. The page must show ClippyOS chrome (Dashboard heading or the 18-item nav), not a connection error.

- [ ] **Step 3: Hit public and login shells**

Navigate to `http://127.0.0.1:8080/` (marketing/landing) and `http://127.0.0.1:8080/login`. Snapshot each. Record whether Google/X/email controls render. Do not submit real OAuth.

- [ ] **Step 4: Write the load note**

Write `dogfood-output/sdd-2026-09-18/task-1-load.md` with origin, HTTP codes, `pageId`, whether auth is gated, and any console errors other than the expected extensions.js CSP block.

- [ ] **Step 5: Commit only if you added tracked files the plan requires**

If the load note should stay untracked evidence, do not commit binary screenshots. Do not commit `.env`.

---

### Task 2: Exercise all 18 operator tabs and create test records

**Files:**

- Create: `dogfood-output/sdd-2026-09-18/findings.jsonl`
- Create: `dogfood-output/sdd-2026-09-18/task-2-tabs.md`

**Interfaces:**

- Consumes: origin and `pageId` from Task 1
- Produces: `findings.jsonl` lines `{severity,category,route,title,repro,expected,actual}`; test client `Dogfood QA Client` and test lead `Dogfood QA Lead` if the UI allows create without admin secrets

Nav destinations (visit each, snapshot heading, interact with safe filters/search/dialogs):

`/home` `/money` `/clients` `/calendar` `/leads` `/ideation` `/agent` `/thumbnails` `/library` `/social` `/inbox` `/approvals` `/health` `/analytics` `/team` `/onboarding` `/billing` `/settings`

- [ ] **Step 1: Walk every nav item**

For each route: navigate, wait for that route's heading, snapshot, list console errors (ignore extensions.js CSP). Click primary safe filters. Open Add Client / Add Lead dialogs.

- [ ] **Step 2: Create test data where the form saves**

On Clients, fill name `Dogfood QA Client` and save if the control is enabled. On Leads, fill `Dogfood QA Lead` and save if enabled. Do not mark invoices paid. Do not start the Social VM. Do not click Test Connection if the copy says it would start Computer Use — AGENTS.md §3.5.

- [ ] **Step 3: Settings surface**

On `/settings`, wait for heading `Settings` then `#integrations`. Open one add-on guide and close it. Do not paste secrets.

- [ ] **Step 4: Log defects**

Append confirmed product bugs to `findings.jsonl`. Harness mistakes are not product bugs.

- [ ] **Step 5: Write `task-2-tabs.md`** covering each route: loaded / empty / populated / blocked.

---

### Task 3: Exercise Agent commands with the YouTube fixture

**Files:**

- Modify: `dogfood-output/sdd-2026-09-18/findings.jsonl`
- Create: `dogfood-output/sdd-2026-09-18/task-3-agent.md`

**Interfaces:**

- Consumes: origin from Task 1; YouTube URL `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Produces: confirmation that `/autoclip`, `/short`, `/voice`, `/image` cards accept input; Generate stays disabled without Crayo

- [ ] **Step 1: Open Agent and each slash card**

From `/agent`, open `/autoclip`, `/short`, `/voice` (or `/voiceover`), `/image`. Snapshot each card.

- [ ] **Step 2: Load the YouTube URL into AutoClip**

Paste `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, select 5 clips, confirm the URL stays in the field. Try `not-a-url` and confirm invalid state. Do not click Generate if it is disabled for missing credentials.

- [ ] **Step 3: Observe voice disconnected UI**

With Crayo unconfigured, record whether `/voice` shows a skeleton vs an explicit disconnected message (prior defect F-02 at `src/components/agent/tool-cards.tsx` VoiceoverFields: `voicesQuery.isPending` while `enabled: crayoReady` is false).

- [ ] **Step 4: Compare Crayo setup copy**

Record Agent banner copy (`Settings → Add-ons → Crayo.ai`) vs card copy (`Settings → Integrations → Crayo.ai`) — prior defect F-04.

- [ ] **Step 5: Write `task-3-agent.md`.**

---

### Task 4: Fix confirmed UI defects

**Files:**

- Modify: `src/components/agent/tool-cards.tsx` (VoiceoverFields pending branch; disconnected Crayo copy)
- Modify: `src/routes/_app/agent.tsx` (banner copy to match Settings heading)
- Test: `src/components/agent/tool-cards.test.ts` (create if the tree has no co-located test; otherwise extend the nearest existing agent test)

**Interfaces:**

- Consumes: F-02 and F-04 plus any Critical/High findings from Tasks 2–3 that have a one-file owner
- Produces: disconnected voice card never shows a skeleton; both Crayo prompts use `Settings → Add-ons → Crayo.ai`

- [ ] **Step 1: Write a failing unit test for the disconnected voice state**

If extracting a pure helper is the smallest path, add `voiceSelectState(crayoReady: boolean, isPending: boolean, voiceCount: number): "connect" | "loading" | "empty" | "ready"` in `src/lib/agent-voice-ui.ts` (or adjacent) and test:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { voiceSelectState } from "./agent-voice-ui.ts";

test("disconnected Crayo is connect, not loading", () => {
  assert.equal(voiceSelectState(false, true, 0), "connect");
  assert.equal(voiceSelectState(true, true, 0), "loading");
  assert.equal(voiceSelectState(true, false, 0), "empty");
  assert.equal(voiceSelectState(true, false, 2), "ready");
});
```

Run: `node --experimental-strip-types --test src/lib/agent-voice-ui.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 2: Implement the helper and wire VoiceoverFields**

`connect` renders: `Connect Crayo in Settings → Add-ons → Crayo.ai to load voices.`
Do not render `<Skeleton>` unless state is `loading`.

- [ ] **Step 3: Align copy in `agent.tsx` and `tool-cards.tsx` to `Settings → Add-ons → Crayo.ai`**

- [ ] **Step 4: Fix additional Critical/High findings from `findings.jsonl` only when the owner file is obvious and the change is smaller than ~40 lines. Skip Social VM / payment / publish.**

- [ ] **Step 5: Run tests and typecheck**

`node --experimental-strip-types --test src/lib/agent-voice-ui.test.ts`
`npm test`
`npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add src/lib/agent-voice-ui.ts src/lib/agent-voice-ui.test.ts src/components/agent/tool-cards.tsx src/routes/_app/agent.tsx
git commit -m "fix(agent): disconnected Crayo voice state and Add-ons copy"
```

---

### Task 5: Re-verify in the browser and write the report

**Files:**

- Create: `docs/2026-09-18-sdd-frontend-dogfood-report.md`
- Modify: `dogfood-output/sdd-2026-09-18/task-5-reverify.md`

**Interfaces:**

- Consumes: Task 4 commit; origin from Task 1
- Produces: report with executive summary, per-issue table, what was tested vs blocked, and re-verify of F-02/F-04

- [ ] **Step 1: Reload `/agent`, open `/voice`, confirm no skeleton when Crayo is disconnected**

- [ ] **Step 2: Confirm both banner and card say Add-ons**

- [ ] **Step 3: Spot-check `/clients` still shows the test client if created**

- [ ] **Step 4: Write `docs/2026-09-18-sdd-frontend-dogfood-report.md`** using severity Critical/High/Medium/Low and categories Functional/Visual/Accessibility/Console/UX/Content. Include MEDIA paths for screenshots. State remaining blockers (Crayo/Daytona keys, empty admin surfaces).

- [ ] **Step 5: Commit the report only (not `dogfood-output/` binaries unless already tracked)**

```bash
git add docs/2026-09-18-sdd-frontend-dogfood-report.md docs/superpowers/plans/2026-09-18-clippyos-frontend-dogfood.md
git commit -m "docs: ClippyOS frontend dogfood findings after SDD pass"
```
