# AGENTS.md — Operating Guide for ClippyOS

This is the operating contract for any human or AI agent working in this
repository. ClippyOS is the **Autonomous Operating System for Clipping**: a
production agency OS (clients, money, production, publishing, client portal)
with a leashed autonomy layer. Read this file fully before writing code.
Pair it with [README.md](README.md) (product tour) and
[CONTRIBUTING.md](CONTRIBUTING.md) (PR rules).

---

## 1. Repo map

| Path | What lives there |
|---|---|
| `src/routes/` | TanStack Start file routes: `_app/*` (18 operator screens), `portal/*` (client portal), `api/*` (HTTP surface), `login.tsx`, public landing |
|`src/routes/api/`|`v1.$.ts` (scoped REST API), `mcp.ts` + `oauth/` (MCP over OAuth 2.1), `webhooks/` (telegram, whatsapp, whop, inbound), `cron/ops.ts`, `health.ts`, `library.*`, `auth/$`|
| `src/lib/` | Client-safe domain modules (`autonomy.ts`, `playbooks.ts`, `skills.ts`, `nav.ts`, …) and co-located `*.test.ts` |
| `src/lib/server/` | **Server-only** domain logic (agent loop, social ops, publishers per platform, storage, integrations). Never import from client code |
| `src/lib/auth/` | Better Auth wiring; `*.server.ts` variants verify sessions |
| `src/lib/supabase/` | Storage/secret resolution for the clip library |
| `migrations/` | Add-only SQL migrations `NNNN_name.sql`; tracked in `_migrations` |
| `supabase/schema.sql` | Consolidated schema mirror — keep in sync with migrations |
| `scripts/` | Pipeline + QA: `migrate.ts`, `with-app-env.ts`, `check-auth-invariant.ts`, `patch-ssr-exports.ts`, `browser-smoke.ts`, `qa-*.ts` Playwright suites |
| `server/middleware/` | Platform chrome (PWA/branding injector) — do not modify |
| `public/marketing/` | Captured product GIFs/JPGs used by the README and landing page |
| `.github/` | CI (`workflows/ci.yml`: Node 22 → `npm ci && npm test && npm run typecheck`), issue/PR templates |

## 2. Commands (run them as written)

```bash
npm run dev        # vite dev on 0.0.0.0:8080 via scripts/with-app-env.ts
npm run build      # vite build → patch-ssr-exports → db:migrate (applies SQL)
npm run preview    # serves built output on 127.0.0.1:8081
npm test           # node --test over scripts/**/*.test.ts + src/**/*.test.ts
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm run format     # prettier
npm run check:auth # dev server vs next build must agree on VITE_AUTH_ENABLED
npm run db:migrate # apply pending migrations to DATABASE_URL target
```

Hard rules:

- Start dev through `npm run dev` only — invoking `vite` directly skips
  `scripts/with-app-env.ts` and desyncs `VITE_AUTH_ENABLED`
  (`scripts/check-auth-invariant.ts` exists to catch exactly that).
- Port contracts are load-bearing: dev `0.0.0.0:8080`, preview
  `127.0.0.1:8081`, both strictPort (`vite.config.ts`). Do not change them.
- Never commit a `.env`. `.env.example` documents names only.

## 3. Architecture contracts (violating these is a bug even if tests pass)

### 3.1 Data layer — dual backend, one schema

- `DATABASE_URL` set ⇒ managed Postgres via `pg`; unset ⇒ embedded PGLite
  with the same migrations auto-applied (`src/lib/db.ts`). Both backends must
  return identical JSON-safe shapes: int8→number, date→string
  (`src/lib/db.ts:53-64`).
- All schema changes are new files `migrations/NNNN_name.sql`. **Never edit an
  applied migration.** Update `supabase/schema.sql` in the same PR. Migrations
  apply during `npm run build` on deploy and automatically on PGLite at boot;
  the glob does not descend into `migrations/auth/`.
- Define tables in migrations — never inline DDL in server functions.

### 3.2 Tenancy & auth

- Sign-in is Better Auth (Google / X / email). Every privileged query runs in
  a verified server function bound to the session — never trust a
  client-sent user id.
- Postgres RLS is enabled with **no anon/authenticated policies**
  (`supabase/schema.sql:7-12`); the secret key bypasses RLS by design, so the
  server-function boundary *is* the authorization boundary. Keep it that way:
  data access goes through `src/lib/server/**`, not ad-hoc clients.
- Server-only boundary: `src/lib/server/**` and `*.server.ts` never appear in
  client imports. `getSql()` throws in the browser on purpose
  (`src/lib/db.ts:173-178`) — don't "fix" that.

### 3.3 Secrets

- Credentials resolve from process env or operator Settings — **never from
  source**. Preview fallbacks with literal keys were removed by design; do
  not reintroduce them. If a feature needs a key it doesn't have, degrade
  gracefully and surface availability in `/health`.

### 3.4 Autonomy stays leashed

- Default playbook policies are conservative
  (`DEFAULT_PLAYBOOK_POLICIES`, `src/lib/playbooks.ts`): no auto-mark-paid,
  no stage jumps without evidence, social uploads default `draft`. Don't flip
  defaults in a feature PR.
- Anything in `HUMAN_APPROVAL_REQUIRED_FOR` (`src/lib/playbooks.ts:45`)
  routes through `/approvals`. New autonomous capabilities need a scope in
  `API_KEY_SCOPES` (`src/lib/autonomy.ts:5`), an audit trail, and idempotency
  (see `src/lib/server/autonomy-audit.server.ts`).
- Agent-proposed Skills land as `pending_review` (`src/lib/skills.ts`); skill
  sandboxes default to no network.

### 3.5 Social Machine (Daytona Windows VM)

- Computer Use is the VM's only job. Cron and Test Connection **never start
  it** (`src/routes/api/cron/ops.ts`). Idle ⇒ pause, not destroy; hibernate
  snapshots while running. Clips/assets never live on the VM — storage chain
  is Supabase Storage → optional S3 overflow → IPFS pin only.
- Liaison chats (Telegram/WhatsApp, `/inbox`) never use Computer Use.

### 3.6 Platform chrome — do not break

- `grokPwaPlugin()` and `server/middleware/grok-pwa.ts` inject required
  branding; `<PreviewHostBridge />` stays mounted in the root shell; the
  auth-popup middleware wins `/auth/popup`.
- Nitro config is fragile by necessity: keep `preset: "vercel"`,
  `serverDir: "./server"`, `inlineDynamicImports: true`, and the
  post-build SSR patcher exactly as wired in `vite.config.ts` — removing any
  of them breaks every deployed document request.

## 4. Testing conventions

- Units use the Node built-in runner: bare behavioral sentences,
  `test("...", ...)`, small factory helpers, assertions on whole values — no
  `describe`/`it` nesting. Co-locate as `*.test.ts` (scripts) or
  `src/**/*.test.ts`.
- UI flows have Playwright suites `scripts/qa-*.ts` (23 of them, one per
  surface: portal, autonomy, library, publishers, safety, mobile, …). Extend
  the matching suite when you change a screen.
- `node scripts/browser-smoke.ts` renders desktop + mobile headlessly and
  prints a JSON verdict (status, body text, console errors, screenshots).
  A clean verdict is part of done for UI work.
- Marketing captures regenerate via `scripts/capture-marketing*.ts`;
  brand gates live in `scripts/brand-check.ts` (og card size, x-banner).

## 5. Definition of done

Run on your change and quote real output:

1. `npm test`
2. `npm run typecheck`
3. `npm run lint`
4. Auth/route changes: `npm run check:auth` against a running dev server
5. UI touched: relevant `scripts/qa-*.ts` or `browser-smoke.ts`

CI enforces 1–2 on Node 22 (`.github/workflows/ci.yml`); the rest is on you.

## 6. Commits & PRs

- Conventional commits with scope: `feat(library):`, `fix(auth):`,
  `docs(readme):`, `chore(ci):`. One logical change per PR.
- Use [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) —
  its contracts checklist mirrors §3 above.
- Schema changed? New migration + `supabase/schema.sql` updated together.
