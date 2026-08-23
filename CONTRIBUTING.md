# Contributing to ClippyOS

Thanks for helping build the Autonomous Operating System for Clipping. This
repo runs a strict pipeline — planning before code, review before hardening,
verification before release — and these rules keep it honest.

## Getting started

```bash
npm install        # Node 22+
cp .env.example .env   # names only; real values stay out of git
npm run dev        # http://localhost:8080 (local PGLite auto-migrates)
```

Read [AGENTS.md](AGENTS.md) first: it maps the repo, the architecture
contracts (RLS model, server-only boundary, migration immutability), and the
full command list.

## Verification matrix (required for every PR)

Run all of these on your change and quote real output:

1. `npm test`
2. `npm run typecheck`
3. `npm run lint`
4. UI changes: exercise the touched surface (`scripts/qa-*.mjs` suites exist
   for most modules).
5. Auth/route changes: `npm run check:auth` against a live dev server.

CI (`.github/workflows/ci.yml`) enforces tests + typecheck on Node 22.

## Conventions

- **Conventional commits** with scope: `feat(library):`, `fix(auth):`,
  `docs(readme):`, `chore(ci):`.
- **One logical change per PR.**
- **Migrations:** add `migrations/NNNN_name.sql`; never edit an applied
  migration. Keep `supabase/schema.sql` consistent with new migrations.
- **Server-only code** stays under `src/lib/server/` / `*.server.ts` and is
  never imported from client modules.
- **No secrets**, ever — env vars or operator Settings; `.env.example`
  documents names only.
- Tests use the Node built-in runner (`*.test.mjs` beside the subject or
  `src/**/*.test.ts`).

## Opening a PR

Use the PR template. Describe what changed, why, and how you verified it.
Screenshots/GIFs for UI changes go a long way.

## Reporting security issues

Do not open public issues for vulnerabilities — see
[SECURITY.md](SECURITY.md).

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
