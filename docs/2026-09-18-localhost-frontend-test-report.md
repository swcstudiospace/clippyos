# ClippyOS Localhost Frontend Test Report

Date: 2026-09-18

## Verdict

**PARTIAL VALIDATION. Full application and Crayo end-to-end operability are NOT certified.**

All 11 Crayo slash entries were exercised through both shortcut clicks and composer submission. The observed cards, field editing, AutoClip validation, clip-count options, image aspect options, and dismissal worked. Real generation, importing, exporting, and ingestion were blocked by absent Crayo credentials. No jobs were submitted and no credits were spent.

All 18 primary navigation destinations were visited. Selected safe controls were exercised in depth. This is not an exhaustive test of every clickable element: the workspace has no client, asset, payment, run, or approval records, and the current user lacks administrative privileges. Inventing records, bypassing access controls, or treating disabled buttons as successful execution would invalidate the result.

## Environment

- Repository: `/root/src/repos/clippyos`.
- Origin: `http://127.0.0.1:8080`, started with the required `npm run dev`.
- Browser: real Chromium 151.0.7922.34 through Playwright, headless on the Linux development host.
- Viewports: desktop 1440x1000 and mobile 390x844.
- The integrated visible browser returned `ERR_CONNECTION_REFUSED` for its localhost; the Chrome MCP connection returned `Target closed`. Local Chromium was used instead. A human-visible browser session was not established.
- Existing configuration was preserved: workspace auth flag false, existing Dev User/member preview identity, no authentication override introduced.
- `DATABASE_URL`, `CRAYO_API_KEY`, and `DAYTONA_API_KEY` were unset in the launch environment. The UI also confirmed Crayo, planner, and Daytona were unconfigured. Other integrations must not be assumed absent merely because these three are unset; Telegram appeared configured.
- No application source edits, credentials, paid jobs, public posts, payment changes, destructive operations, or migrations were performed.

## YouTube Test Data

Source: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, reused from the existing `scripts/qa-autoclip-agent.ts` fixture.

1. YouTube's oEmbed endpoint returned HTTP 200 and the title “Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)”.
2. Loaded this verified URL into Agent > `/autoclip` > Video URL.
3. Selected 3, 5, 8, 10, and then 5 clips, checking the displayed selection.
4. Submitted `/autoclip https://www.youtube.com/watch?v=dQw4w9WgXcQ` in the composer; the resulting card preserved the URL.
5. Also populated Analytics' channel field with the returned author's channel URL, without connecting or importing analytics.

**Limit:** metadata accessibility and form acceptance are verified, not media downloadability, ownership permission, successful Crayo import, or rendered clips. The URL was loaded in transient form state; no video was persisted to Library. No actual Crayo project or CDN asset was fabricated. Use operator-owned/licensed footage for an approved real processing run.

## Evidence And Reproduction

Primary completed pass:

- [Full results and per-action snapshots](../dogfood-output/localhost-audit-2026-09-18T10-20-46-672Z/results.json)
- [YouTube URL loaded with five clips](../dogfood-output/localhost-audit-2026-09-18T10-20-46-672Z/autoclip-valid-youtube-5-clips.png)
- [Voice card](../dogfood-output/localhost-audit-2026-09-18T10-20-46-672Z/composer-voice.png)
- [Mobile Agent](../dogfood-output/localhost-audit-2026-09-18T10-20-46-672Z/mobile-agent.png)
- [Initial HTTP 500](../dogfood-output/screenshots/2026-09-18-agent-startup-error.png)
- [Settled Settings](../dogfood-output/screenshots/2026-09-18-settings-settled.png)

The primary pass logged **115 successful actions**, **11 command entries**, and **22 route visits** (18 desktop plus four mobile). It recorded 689 visible control observations across desktop routes; that number includes repeated navigation chrome and is **not** a unique-element count or a claim that all 689 controls were clicked.

The primary pass waited only for any h1 during navigation. Its first Settings snapshot still showed Billing after the URL changed; that observation is not a Settings pass. A dedicated follow-up confirmed the Settings heading and integration controls. The reusable script now waits for the destination's exact heading.

Expanded control evidence and final rerun totals are recorded in the completion section below.

Re-run against the existing local preview environment:

```bash
npm run dev
# In a second terminal:
node --experimental-strip-types scripts/qa-localhost-audit.ts
node --experimental-strip-types scripts/qa-localhost-controls.ts
```

Each script creates a new timestamped evidence directory, records actions and before/after accessibility snapshots, and closes its browser. No mock API responses or forced disabled clicks are used. Scripts are designed for the observed unconfigured Dev User environment, not arbitrary production accounts. They return nonzero on failed action assertions. A successful click alone proves interaction delivery, not downstream business success; semantic assertions and the limitations below qualify the results.

## Crayo Command Matrix

Every row includes shortcut open, dismiss, composer entry/Enter, resulting card capture, and dismiss.

| Entry        | Verified interaction                                                         | Real execution                                                            |
| ------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `/short`     | Topic preserved in short card; Generate short disabled without key           | Blocked: image, voice, project, export, Library chain                     |
| `/autoclip`  | Verified YouTube URL preserved; all four count options; invalid URL warnings | Blocked: Daytona fetch, Crayo import, clipping, polling, exports, Library |
| `/voice`     | Script retained; title truncated to 25 characters                            | Blocked: voice catalog and generation; loading-state defect below         |
| `/voiceover` | Alias opens equivalent card; same title limit                                | Blocked: same as `/voice`                                                 |
| `/image`     | Prompt retained; 16:9, 1:1, and 9:16 selections applied                      | Blocked: image generation and ingestion                                   |
| `/voices`    | Read-only catalog card displays disconnected state                           | Blocked: live voice listing                                               |
| `/account`   | Read-only account card displays missing-key state                            | Blocked: actual account and credits                                       |
| `/import`    | Empty file URL/name form opens; Import disabled                              | Blocked: no direct-file fixture imported                                  |
| `/export`    | Empty project ID form opens; Export disabled                                 | Blocked: no real project/export ID                                        |
| `/assets`    | Read-only asset card displays disconnected state                             | Blocked: live asset listing                                               |
| `/ingest`    | Empty CDN URL/title form opens; Ingest disabled                              | Blocked: no real approved Crayo CDN asset                                 |

AutoClip negative cases:

- `not-a-url`: invalid HTTPS URL warning and `aria-invalid=true`.
- `http://example.com/video.mp4`: HTTPS-only warning and disabled action.
- `https://drive.google.com/file/d/test/view`: sign-in/share-link warning and disabled action.
- Restoring the verified HTTPS YouTube URL restored the normal source hint.

Additional Agent controls: More clipping commands, More clipping presets, `/clip walkthrough`, notification overlay, account menu, theme toggle, sidebar collapse/expand, and mobile Runs/Context drawers. The walkthrough itself was opened, not completed without a client.

## Application Coverage

| Surface    | Executed coverage                                                                     | Remaining gaps                                                          |
| ---------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Dashboard  | Navigation, rendered empty-state and quick-link inventory                             | To-do persistence, client actions, analytics refresh outcomes           |
| Money      | Navigation, reporting-period filters                                                  | Payment collection and populated financial calculations                 |
| Clients    | Search, status filters, edit-mode toggle, Add Client dialog open/close                | Save, editing existing records, deletion, client detail tabs            |
| Calendar   | Previous/next month, Today, collection-window filters, day sheet by mouse/Enter       | Actual invoice collection                                               |
| Leads      | Search, all status filters, Add lead dialog open/close                                | Create/edit/delete records                                              |
| Ideation   | Navigation, empty-state inventory                                                     | Planner, conversation persistence, generated responses                  |
| Agent      | All 11 Crayo entries and controls described above                                     | All live job execution and resulting media                              |
| Thumbnails | Navigation, empty-state inventory                                                     | Generation, canvas editing on real media, session persistence           |
| Library    | Client/kind/source/status/date options, search, Assets/Generate/Renders view switches | Upload, import, playback, download, captions, render jobs               |
| Social     | Navigation, mobile upload sheet                                                       | VM start, native uploads, scheduling, publish, cancel/retry             |
| Inbox      | Navigation, empty-state inventory                                                     | New threads, sending, external delivery                                 |
| Approvals  | All/Waiting views                                                                     | Approve/reject populated jobs and authority enforcement                 |
| Health     | Navigation and integration/job status inventory                                       | Real service health, live worker recovery                               |
| Analytics  | Platform filters; channel input editing                                               | API pulls, persisted snapshots, channel-client matching                 |
| Team       | Navigation and empty-state inventory                                                  | Staff creation, assignment, automation token links                      |
| Onboarding | Navigation and checklist inventory                                                    | Persisted checklist workflow and populated clients                      |
| Billing    | Navigation and plan/invoice inventory                                                 | Checkout, plan changes, cancellation, invoices                          |
| Settings   | Fully settled UI, setup guides, schema viewer where available                         | Credential saves, OAuth login, role changes, provider tests, migrations |

Public marketing, login/OAuth, password recovery, client portal, PWA installation, browser permissions, and desktop-native flows are outside the validated matrix. “All core functionality works” is not supported by these results.

## Defects And Observations

### F-01: Cold Start Can Return HTTP 500

Severity: high when encountered; recovered locally after one restart.

Reproduce: start `npm run dev` from the observed initial state; visit `/agent` during initial compilation. Chromium displayed `{"status":500,"unhandled":true,"message":"HTTPError"}`. Subsequent requests continued returning 500 until restart.

Server evidence: Vite reported `transport invoke timed out after 60000ms` while fetching `/src/routes/docs.tsx` from `src/routeTree.gen.ts`. Vite startup itself reported 41,798 ms. A separate earlier aborted HTTP probe also logged `ECONNRESET`; do not conflate that probe with the module timeout.

Expected: application renders, or startup remains explicitly unavailable without leaving route loading failed. After one clean restart, Agent returned 200 and rendered. Root cause and repeatability remain unproven; this is not evidence that `docs.tsx` contains the bug.

### F-02: Disconnected Voice Card Shows Loading Skeleton

Severity: low, confusing disconnected state.

Reproduce: with Crayo unconfigured, open `/voice` or `/voiceover`. The Voice label has a skeleton but no selectable control; the generation button is correctly disabled. The card also shows a missing-key warning.

Expected: explicit “Connect Crayo to load voices” state, not a loading indicator for a disabled request.

Source: `src/components/agent/tool-cards.tsx:372` disables the query with `enabled: crayoReady`; line 390 renders the skeleton on `isPending`. An unfetched disabled query remains pending. `/voices` separately handles `!crayoReady` before its pending branch.

Evidence: linked voice screenshot and both command snapshots. No generation failure is inferred from this UI defect.

### F-03: Slow Settings Readiness

Severity: medium performance observation; development-only measurements.

Reproduce: directly open `/settings` in fresh local Chromium and wait for the heading and then `#integrations`.

Observed dedicated run: heading visible after 25,525 ms; integration section visible after 40,669 ms. An earlier route snapshot caught the previous Billing content before Settings settled.

Expected: timely usable controls with clear loading feedback. The page eventually loaded, so this is not a broken Settings route. Source inspection shows the whole Settings page is gated on `getSupabaseStatus`; external probing and cold development compilation may contribute. Do not treat this single measurement as a production percentile, Core Web Vital, or established root cause.

### F-04: Inconsistent Crayo Setup Directions

Severity: low documentation/UI consistency.

Reproduce: open any runnable Crayo card while disconnected. The Agent banner directs users to “Settings > Add-ons > Crayo.ai”; the card directs users to “Settings > Integrations > Crayo.ai”.

Expected: one consistent name/link. Settings renders an “Add-ons” heading inside `#integrations`, plus a separate “Add-on registry”. Both strings refer to the integration area, but the labels can confuse users.

Sources: `src/routes/_app/agent.tsx:317` and `src/components/agent/tool-cards.tsx:118`.

### Environment And Non-defect Observations

- Grok's injected `https://grok.com/grok-app-builder/extensions.js` is blocked by CSP. The primary run captured five console violations and five matching network failures, with no application page exceptions. The existing smoke verifier explicitly classifies this exact block as expected platform noise (`scripts/browser-smoke-verdict.ts:190`). Do not relax CSP to remove the noise.
- Settings displayed 50/56 workspace tables ready and six missing. The UI checks an external Supabase project as well as local state; this is not proof the local PGLite schema lacks those tables. Apply migrations only after an operator confirms the intended database.
- The preview user is a member. Owner-only billing and admin controls remain unavailable.
- Four missing-integration banners occupy substantial space above Agent on mobile. Composer access requires scrolling. No horizontal document overflow was observed on Agent, Library, Settings, or Dashboard at 390px.
- Initial harness failures from a delayed welcome dialog, duplicate Add Client buttons, wrong “Pending” label, and targeting mobile-only upload at desktop were test defects, not product bugs. Superseded evidence is retained for transparency.

## Supporting Checks

- Targeted command/media tests: 29 passed, zero failed.
- Full `npm test`: 397 total, 396 passed, one skipped, zero failed.
- `npm run typecheck`: passed.
- ESLint scoped to the two new audit scripts: passed after final harness refinements. Repository-wide lint was not run.
- No production build or `db:migrate` was run because those commands can apply migrations.

Unit tests support parser/helper correctness; they do not prove browser integration or live Crayo API behavior.

## Completion Record

- [Final expanded control run](../dogfood-output/controls-audit-2026-09-18T10-29-29-633Z/results.json): 109 successful actions, zero failures, one additional mobile-navigation inventory record. All 12 captured console errors were the expected injected-script CSP block; no application page exceptions or HTTP errors were captured in this run.
- [Complete setup-guide follow-up](../dogfood-output/screenshots/2026-09-18-settings-guides.json): all 12 integration guides opened and closed with Done; Workspace schema viewer opened and closed. Thirteen successful recorded scenarios. This separate follow-up closes a harness coverage gap: counting visible guide buttons while a modal was dismissing had ended the earlier loop after its first guide. The reusable harness now captures the count before opening and waits for each dialog to close.
- Primary plus expanded passes: **224 successful action records**. The 13 setup/schema scenarios are separate and contain multiple interactions; do not combine these into a unique-click count.
- Final `npm run typecheck` and scoped ESLint both exited 0. Full regression totals remain 396 passed, one skipped, zero failed.
- The exact-heading improvement in the primary audit was typechecked but not followed by a second full primary run; the dedicated Settings and complete-guide follow-ups validate the previously ambiguous destination.
- Evidence links were checked for existence. Application source remains unchanged; only the report, two reusable QA scripts, and generated test evidence were added. Earlier interrupted/superseded audit directories are retained, not represented as passing runs.
- The development server was left running on port 8080. Browser automation contexts were closed.

## Required To Finish End-to-end Validation

1. Have an authorized operator configure Crayo and Daytona in this same environment, complete any login themselves, and provide a capped credit/compute budget.
2. Provide owned/licensed public YouTube test footage and a populated test client. Verify duration, accessible media, download limits, and storage configuration before submitting AutoClip.
3. Run every generation command to completion, record tool calls, job IDs, status transitions, actual playable outputs, Library asset IDs, and error recovery. Test voice selection with a real voice ID, export with a real project ID, ingest with a real Crayo CDN URL, and import with a direct downloadable file.
4. Verify idempotency, retry/cancel behavior, reload persistence, and credit usage. Do not force disabled controls or substitute fabricated success responses.
5. Seed isolated test records for client, payment, media, approval, social, and inbox workflows; test all row actions with a test owner/admin and a member. Publishing, charging, and destructive operations require a separately approved sandbox scope.
6. Repeat public/auth/portal and desktop-native coverage, mobile full journeys, keyboard focus checks, and production-build performance measurements before a production-ready sign-off.
