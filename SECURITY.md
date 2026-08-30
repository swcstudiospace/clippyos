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
  (Telegram, WhatsApp, Whop), MCP endpoints, and OAuth 2.1 flows
- Data isolation / RLS assumptions documented in `supabase/schema.sql`
- Storage chain (Supabase Storage, S3 overflow, IPFS pin layer)
- Operator secret storage and automation-seat scoping

Out of scope:

- Third-party services themselves (Supabase, Vercel, Daytona, Telegram,
  WhatsApp, Whop) — report to those vendors
- Volumetric denial-of-service
- Social-platform account challenges caused by datacenter IPs

## Deployment hygiene expectations

- Secrets live in Vercel env vars or operator Settings — never in git.
- RLS is enabled with no anon/authenticated policies; privileged access flows
  exclusively through verified server functions.
- The cron route requires `CRON_SECRET` (Bearer) and can never start the Social
  Machine. The `x-vercel-cron` header is not accepted on its own.
- Operator secrets in `operator_secrets` are encrypted at rest with AES-256-GCM
  when `OPERATOR_SECRETS_KEY` or `BETTER_AUTH_SECRET` is set.

## Incident response (IR-1 / IR-4 / IR-6)

1. **Detect.** `/health` SLO strip, job DLQ, autonomy audit log, Vercel logs, and
   GitHub private vulnerability reports.
2. **Contain.** Revoke the affected API / MCP / webhook credential in Settings →
   Automation. Rotate `CRON_SECRET`, OAuth client secrets, and
   `OPERATOR_SECRETS_KEY` in Vercel. Sign the operator out of Social publishers.
   Do not start the Social Machine while investigating.
3. **Eradicate.** Patch on `main`, deploy, confirm `/health` integrations are
   green, and re-issue scoped keys. Treat `enc:v1:` ciphertext that fails to
   decrypt after a key rotation as lost — re-enter the secret.
4. **Recover.** Re-run failed jobs from `/health`. Confirm library assets still
   resolve. Restore Social Machine only after the publisher session is rotated.
5. **Lessons.** File a POA&M row in `COMPLIANCE.md` for anything that needs a
   follow-up control. Credit reporters after disclosure.

Severity targets match the table above. Critical credential leaks: rotate first,
then patch. Do not discuss active incidents in public issues.
