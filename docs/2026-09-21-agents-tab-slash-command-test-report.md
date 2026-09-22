# Agent tab slash-command test report

Date: 2026-09-21

## Verdict

**Slash-command surface works end to end up to the Crayo credit wall; four app-side defects found and fixed in the same session (uncommitted).**

All Crayo card commands and the client-independent clipping commands were exercised live from the Windows XPS 15 Chrome (via the Claude-in-Chrome pairing) against the VPS dev server, with SuperGrok OAuth, Crayo and Daytona configured by the operator in Settings. The Crayo account is on the Free plan with 0 credits, so every generating command stops at Crayo with a credit error; that error is surfaced correctly and is not an app bug.

## Environment

- Repository: `/root/src/repos/clippyos`, `vite dev --host 0.0.0.0 --port 8080` on the VPS.
- Browser: Chrome on the XPS 15, reached via an SSH local forward (`ssh -N -L 8080:127.0.0.1:8080 root@<vps>`) because the tailnet ACL only passes port 443 to the VPS. A Tailscale Serve mapping on :9443 → 8080 already exists but is blocked by that ACL.
- Providers: SuperGrok OAuth (grok-4.6) as planner, Crayo (Free plan, 0 credits), Daytona. No `DATABASE_URL` (PGLite fallback).
- Keys were entered by the operator; no key values were read, typed or logged by the agent.

## Results

| Command                           | Result                        | Notes                                                                                                                               |
| --------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| /account                          | PASS                          | Plan · Free, credits 0/0/0/0                                                                                                        |
| /voices                           | PASS                          | 40 voices listed                                                                                                                    |
| /assets                           | PASS                          | Existing Crayo assets listed                                                                                                        |
| /short                            | PASS (app) · blocked at Crayo | Run planned, `crayo.run_short` → `NO_BALANCE_FOUND` surfaced                                                                        |
| /voice                            | PASS (app) · blocked at Crayo | Voice picker works; `NO_BALANCE_FOUND`                                                                                              |
| /image                            | PASS (app) · blocked at Crayo | `NO_BALANCE_FOUND`                                                                                                                  |
| /autoclip                         | FIXED                         | First run failed with "background fetch lost its job state"; after fix the Daytona job runs to the Crayo upload, which returns 402  |
| /import                           | PASS (app) · blocked at Crayo | 402 mapped to "credits or storage are empty"                                                                                        |
| /export, /ingest                  | NOT RUN                       | Need a Crayo project id / CDN URL                                                                                                   |
| /clip                             | FIXED                         | Walkthrough opens; composer now clears the box (previously "/clip" stayed and merged with the next command)                         |
| /ideas, /thumb, /package, /social | FIXED (gated)                 | Without a pinned client the composer now opens the walkthrough instead of starting a run that failed with a Crayo-flavoured message |
| /nudge                            | FIXED (message)               | Server now reports `CLIENT_REQUIRED` ("needs a pinned client") instead of the /short-/voice validation copy                         |
| /guarantee                        | NOT RUN                       | Same `CLIENT_REQUIRED` path as /nudge                                                                                               |
| /verify                           | FIXED (message)               | Without an upload job id it now says which step lacked input instead of the Crayo card copy                                         |
| /improve                          | PASS                          | Drafted a pending_review skill from the last successful run                                                                         |
| unknown `/foo`                    | FIXED                         | Rejected with a hint instead of being sent to the planner as free text                                                              |

## Fixes (all local, uncommitted)

1. `src/lib/server/agent-loop.server.ts` — when a tool throws `MEDIA_FETCH_PENDING`, merge the persisted `outputs.mediaFetch` job state back into the park patch instead of overwriting it. Root cause of the /autoclip "lost its job state" failure. Also: a `VALIDATION` failure from a non-Crayo tool now names that tool instead of the Crayo card copy.
2. `src/lib/server/agent-tools.server.ts`, `src/lib/agent.ts` — clipping tools that need a client throw `CLIENT_REQUIRED` (fatal) with an accurate explanation; the generic `VALIDATION` copy was Crayo-specific.
3. `src/components/agent/composer.tsx` — `/clip` clears the draft; unknown slash tokens get a hint; `/ideas` `/thumb` `/package` `/social` are gated on a pinned client (same set the walkthrough gates).
4. `src/lib/server/studio-fns.ts` — `crayoAccountFn` keeps the last good plan/credits snapshot across transient Crayo timeouts and 5xx pages, and never returns upstream HTML as the error text.
5. `src/lib/agent-errors.test.ts` — regression test for `CLIENT_REQUIRED`.

Verification: `npx tsc --noEmit` clean, `npx eslint` clean on touched files, `npm test` 398 tests / 397 pass / 0 fail.

## Observations not fixed

- Every full page load sits on "Checking access" for 30–50 s over the SSH tunnel. This is the dev-mode module waterfall (250+ module requests, slowest ~9 s) through a high-latency link, not the billing query; a production build or `optimizeDeps` warmup would remove it.
- Higgsfield remains unconfigured, so /thumb's thumbnail generation was not exercised.
