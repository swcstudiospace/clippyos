## Summary

<!-- What changed and why? Link the issue if one exists. -->

## Type of change

- [ ] `feat` — new capability
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `refactor` — no behavior change
- [ ] `chore` / `ci` — tooling and pipeline

## Verification

Quote real output for everything you ran:

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] UI touched: exercised via dev server or `scripts/qa-*.mjs`
- [ ] Auth/routes touched: `npm run check:auth`

## Contracts check

- [ ] No secrets committed; `.env.example` documents names only
- [ ] Server-only code stayed under `src/lib/server/` / `*.server.ts`
- [ ] If schema changed: new `migrations/NNNN_*.sql` added (no edits to
      shipped migrations) and `supabase/schema.sql` updated
- [ ] Platform chrome untouched (`server/middleware/grok-pwa.ts`,
      `grokPwaPlugin()`, `<PreviewHostBridge />`, `public/__grok/`)
