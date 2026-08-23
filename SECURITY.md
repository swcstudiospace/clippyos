# Security Policy

ClippyOS manages agency money, client channels, social accounts, and
operator credentials. Security reports are taken seriously and handled
privately.

## Supported versions

| Version | Supported |
|---|---|
| `main` (latest deploy) | Yes |
| Older tags/branches | No |

## Reporting a vulnerability

Use **GitHub's private vulnerability reporting** on this repository
(Security tab → Report a vulnerability). Do not open public issues for
security problems.

Include: affected component/URL, impact, reproduction steps, and any proof of
concept. Please do not test against production deployments beyond what is
needed to demonstrate the issue.

## Response targets

- **Triage:** within 3 business days.
- **Fix or mitigation:** critical issues targeted within 7 days; others
  scheduled transparently in the tracker.
- **Credit:** reporters are credited on request after disclosure.

## Scope

In scope:

- Web app auth and session handling (`src/lib/auth/`)
- Server functions and API routes (`src/routes/api/**`), including webhooks
  (Telegram, WhatsApp, Airwallex), MCP endpoints, and OAuth 2.1 flows
- Data isolation / RLS assumptions documented in `supabase/schema.sql`
- Storage chain (Supabase Storage, S3 overflow, IPFS pin layer)
- Operator secret storage and automation-seat scoping

Out of scope:

- Third-party services themselves (Supabase, Vercel, Daytona, Telegram,
  WhatsApp, Airwallex) — report to those vendors
- Volumetric denial-of-service
- Social-platform account challenges caused by datacenter IPs

## Deployment hygiene expectations

- Secrets live in Vercel env vars or operator Settings — never in git.
- RLS is enabled with no anon/authenticated policies; privileged access flows
  exclusively through verified server functions.
- The cron route requires `CRON_SECRET` and can never start the Social
  Machine.
