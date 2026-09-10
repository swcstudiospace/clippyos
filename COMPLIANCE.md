# ClippyOS — NIST 800-53 / FedRAMP Compliance Mapping

This document maps ClippyOS security controls to NIST SP 800-53 Rev. 5 and FedRAMP Moderate baseline requirements.

## System Classification

- **System Name**: ClippyOS — Autonomous Operating System for Clipping
- **Impact Level**: Moderate (per FIPS 199)
- **Authorization Boundary**: Application layer (TanStack Start), Database (PostgreSQL/PGLite), Edge Functions (Vercel/Nitro), External Integrations (Daytona, Supabase, Linear, Social Platforms)
- **Data Types**: PII (client names, emails), Financial (payment records, MRR), Operational (production stages, analytics), Credentials (OAuth tokens, API keys - encrypted at rest)

---

## Control Families Mapping

### AC — Access Control

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| AC-1 | Access Control Policy & Procedures | ✅ Documented in `SECURITY.md`, enforced via Better Auth + RLS |
| AC-2 | Account Management | ✅ Better Auth (Google/X/Email), role-based (admin/member), automated provisioning |
| AC-3 | Access Enforcement | ✅ Server-function boundary (`src/lib/server/**`), RLS on all tables, API key scopes |
| AC-4 | Information Flow Enforcement | ✅ No anon/authenticated RLS policies; secret key bypasses only via server functions |
| AC-5 | Separation of Duties | ✅ Operator vs. Client Portal roles; Human vs. Automation team seats |
| AC-6 | Least Privilege | ✅ API key scopes (`API_KEY_SCOPES`), per-client team assignments, portal isolation |
| AC-7 | Unsuccessful Login Attempts | ✅ Better Auth rate limiting, account lockout |
| AC-8 | System Use Notification | ✅ Login page terms, onboarding checklists |
| AC-11 | Device Lock | ✅ Session timeouts, token rotation (Better Auth) |
| AC-12 | Session Termination | ✅ Sign-out invalidates tokens server-side, preview vs deployed bounds |
| AC-17 | Remote Access | ✅ OAuth 2.1 for MCP, no direct DB exposure |
| AC-20 | Use of External Systems | ✅ Social platform OAuth, Linear OAuth, Daytona VM isolation |
| AC-22 | Publicly Accessible Content | ✅ Marketing landing only; app requires auth |

### AT — Awareness & Training

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| AT-2 | Security Awareness Training | ✅ Onboarding checklists, in-app guides, safety inbox for approvals |
| AT-3 | Role-Based Security Training | ✅ Admin vs Member role distinctions in UI |

### AU — Audit & Accountability

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| AU-2 | Event Logging | ✅ `autonomy-audit.server.ts` — every agent action, API call, stage change, payment |
| AU-3 | Content of Audit Records | ✅ Actor (type, ID), action, entity, result, errorCode, timestamps, requestId |
| AU-4 | Audit Log Storage Capacity | ✅ PostgreSQL with partitioning strategy; PGLite for preview |
| AU-5 | Response to Audit Failures | ✅ Write-ahead logging, fallback to local SQL, audit events never block primary flow |
| AU-6 | Audit Review & Analysis | ✅ `/health` endpoint, DLQ sheet, Hermes runtime monitoring |
| AU-9 | Protection of Audit Information | ✅ RLS on audit tables, server-function only access, immutable append-only |
| AU-12 | Audit Generation | ✅ Automatic on every server function + autonomy action |

### CA — Security Assessment & Authorization

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| CA-2 | Security Assessments | ✅ `scripts/qa-*.ts` Playwright suites (23 surfaces), browser smoke tests |
| CA-3 | System Interconnections | ✅ Documented in `AGENTS.md`; API contracts in `src/routes/api/v1.$.ts` |
| CA-7 | Continuous Monitoring | ✅ `/health` endpoint, cron ops, SLO strip, integration grid |

### CM — Configuration Management

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| CM-2 | Baseline Configuration | ✅ `package.json` locked, migrations add-only, `supabase/schema.sql` mirror |
| CM-3 | Configuration Change Control | ✅ PR required, CI gates (typecheck, lint, test), conventional commits |
| CM-4 | Security Impact Analysis | ✅ `check-auth-invariant.ts` prevents dev/prod flag drift |
| CM-7 | Least Functionality | ✅ No preview fallbacks with literal keys; degraded mode on missing secrets |
| CM-8 | System Component Inventory | ✅ `package.json` + `migrations/` + `scripts/` as source of truth |
| CM-11 | User-Installed Software | ✅ Skills sandbox defaults to no network; agent-proposed skills pending review |

### CP — Contingency Planning

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| CP-2 | Contingency Plan | ✅ PGLite embedded fallback when `DATABASE_URL` unset; zero-config preview |
| CP-6 | Alternate Storage Site | ✅ Supabase → optional S3 overflow → IPFS pin only |
| CP-9 | System Backup | ✅ Supabase managed backups; migrations are idempotent and reversible via new files |

### IA — Identification & Authentication

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| IA-1 | IA Policy | ✅ Better Auth (industry standard), OAuth 2.1 for MCP |
| IA-2 | Identification & Authentication (Organizational Users) | ✅ Google / X / Email; MFA via provider |
| IA-3 | Device Identification | ✅ Session binding, token rotation |
| IA-4 | Identifier Management | ✅ UUIDv7 for entities, crypto.randomUUID for sessions |
| IA-5 | Authenticator Management | ✅ Better Auth handles rotation, revocation, password reset |
| IA-8 | Identification & Authentication (Non-Organizational) | ✅ Client Portal uses separate auth flow; API keys for agents |

### IR — Incident Response

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| IR-1 | Incident Response Policy | ✅ Safety inbox, approval workflow, agent failure hooks |
| IR-4 | Incident Handling | ✅ `safety-hooks.server.ts` — onAgentFailed, onAgentWaitingHuman |
| IR-5 | Incident Monitoring | ✅ DLQ sheet, job feed, Hermes runtime health |
| IR-6 | Incident Reporting | ✅ Audit trail, structured error codes, Telegram/WhatsApp liaison |

### MA — Maintenance

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| MA-2 | Controlled Maintenance | ✅ `npm run db:migrate` gated by build; preview auto-migrates |
| MA-4 | Nonlocal Maintenance | ✅ Daytona VM hibernation (not destroy); SSH via DevPod only |

### MP — Media Protection

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| MP-2 | Media Access | ✅ Assets in Supabase Storage (private by default), signed URLs |
| MP-4 | Media Storage | ✅ No credentials in source; clips/assets never on Daytona VM |
| MP-5 | Media Transport | ✅ HTTPS/TLS 1.2+ for all external calls; chunked upload with resumable sessions |

### PE — Physical & Environmental Protection

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| PE-3 | Physical Access Control | ✅ Vercel/Cloud provider physical security; Daytona VM on demand |
| PE-6 | Monitoring Physical Access | ✅ Provider responsibility (SOC 2 Type II) |

### PL — Planning

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| PL-2 | System Security Plan | ✅ This document + `AGENTS.md` + `SECURITY.md` |
| PL-4 | Rules of Behavior | ✅ `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, agent playbook policies |

### PM — Program Management

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| PM-7 | Enterprise Architecture | ✅ Dual backend (Postgres/PGLite), server-function boundary, TanStack Start |
| PM-9 | Risk Management Strategy | ✅ Conservative playbook defaults, human approval gates, idempotency keys |

### PS — Personnel Security

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| PS-3 | Personnel Screening | ✅ Org-managed (Better Auth invites); no self-serve admin creation |

### RA — Risk Assessment

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| RA-3 | Risk Assessment | ✅ `/health` endpoint surfaces missing secrets, integration status, DLQ depth |
| RA-5 | Vulnerability Scanning | ✅ `npm audit --audit-level=high --omit=dev` in CI, Dependabot, `scripts/brand-check.ts` for supply chain |

### SA — System & Services Acquisition

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| SA-4 | Acquisition Process | ✅ `AGENTS.md` §6 — PR template mirrors architecture contracts |
| SA-9 | External System Services | ✅ OAuth 2.1 for MCP, scoped API keys, Daytona VM isolation |
| SA-10 | Developer Configuration Management | ✅ `.env.example` documents names; no `.env` committed |

### SC — System & Communications Protection

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| SC-1 | SC Policy | ✅ All external calls via typed server functions; no client-side secrets |
| SC-7 | Boundary Protection | ✅ Nitro preset=vercel, middleware order locks auth popup, PWA injector, security headers (CSP/HSTS/COOP), Social Machine `domainAllowList` |
| SC-8 | Transmission Confidentiality | ✅ TLS 1.2+ everywhere; signed URLs for assets |
| SC-13 | Cryptographic Protection | ✅ Better Auth (bcrypt/scrypt), Supabase (AES-256 at rest), AES-256-GCM envelope for `operator_secrets`, UUIDv7 |
| SC-15 | Collaborative Computing Devices | ✅ Social Machine (Daytona VM) isolated; no persistent state |
| SC-28 | Protection of Information at Rest | ✅ PostgreSQL TDE (provider), PGLite in-memory only |

### SI — System & Information Integrity

| Control | ClippyOS Implementation | Status |
|---------|------------------------|--------|
| SI-2 | Flaw Remediation | ✅ `npm run db:migrate` applies migrations; add-only policy prevents drift |
| SI-3 | Malicious Code Protection | ✅ Skills sandbox no-network default; agent tools allowlisted per preset |
| SI-4 | System Monitoring | ✅ Health endpoint, cron ops, SLO strip, job feed, DLQ |
| SI-7 | Software & Firmware Integrity | ✅ `package-lock.json` committed; `npm ci` in CI; no `postinstall` scripts |
| SI-10 | Information Input Validation | ✅ Zod schemas on all server functions + API routes; sanitizeText for UI |
| SI-11 | Error Handling | ✅ Structured error codes (`DATA_UNAVAILABLE`, `VALIDATION`, `UNAUTHORIZED`), no stack traces to client |
| SI-12 | Information Management & Retention | ✅ Soft deletes (`deletedAt`), audit trail immutable, onboarding checklists persisted |

---

## FedRAMP-Specific Enhancements

### Continuous Monitoring (ConMon)

- **Monthly**: `npm run check:auth` against live dev; dependency updates via Dependabot
- **Quarterly**: Full test suite (`npm test` + Playwright QA suites), penetration testing via `scripts/qa-safety.ts`
- **Annually**: Architecture review against `AGENTS.md` contracts; third-party dependency audit

### POA&M (Plan of Action & Milestones)

| Finding | Severity | Remediation | Target |
|---------|----------|-------------|--------|
| Hardcoded constants in `constants.ts` | Low | Migrate to `config.ts` with app_settings override | Open — Q3 2026 |
| Operator secrets stored plaintext | Medium | **Done 2026-08-30** — AES-256-GCM envelope in `secret-crypto.server.ts` keyed by `OPERATOR_SECRETS_KEY` / `BETTER_AUTH_SECRET`. Legacy plaintext rows decrypt as-is and re-encrypt on write. | Closed |
| No formal incident response runbook | Medium | **Done 2026-08-30** — Detect → contain → eradicate → recover in `SECURITY.md`. | Closed |
| Daytona VM network egress not restricted | High | **Done 2026-08-30** — Social Machine `domainAllowList` (publisher + CDN + Google OAuth). Override via `SOCIAL_MACHINE_DOMAIN_ALLOWLIST`; `unrestricted` disables. Skill sandboxes stay `networkBlockAll` unless network is on, then published-host allowlist. | Closed |
| Cron auth accepted spoofable `x-vercel-cron` | High | **Done 2026-08-30** — Bearer `CRON_SECRET` required; fail closed if unset. | Closed |
| Missing HTTP security headers | Medium | **Done 2026-08-30** — CSP, HSTS, nosniff, Permissions-Policy, COOP via `vercel.json` + Vite plugin. | Closed |
| Library URL ingest lacked private-IP deny | Medium | **Done 2026-08-30** — `net-guard.ts` blocks loopback, RFC1918, link-local, metadata, raw IP literals. | Closed |

### Supply Chain Risk Management (SCRM)

- All dependencies pinned in `package-lock.json`
- No `postinstall` or `prepare` scripts in dependencies
- `scripts/brand-check.ts` validates OG card sizes (prevents phishing via oversized cards)
- Skills sandbox: network disabled by default; explicit allowlist per skill

---

## Evidence Artifacts

| Artifact | Location | Controls Supported |
|----------|----------|-------------------|
| `AGENTS.md` | Root | CM-2, CM-3, CM-7, SA-10, PL-2 |
| `SECURITY.md` | Root | IR-1, IR-4, SI-11, AT-2 |
| `supabase/schema.sql` | Root | CM-2, CM-8, SC-28 |
| `migrations/*.sql` | `/migrations` | CM-2, CM-3, SI-2 |
| `scripts/qa-*.ts` | `/scripts` | CA-2, CA-7, SI-4 |
| `scripts/check-auth-invariant.ts` | `/scripts` | CM-4, AC-3 |
| `src/lib/server/autonomy-audit.server.ts` | `/src/lib/server` | AU-2, AU-3, AU-9, AU-12 |
| `src/lib/server/secret-scope.server.ts` | `/src/lib/server` | AC-3, AC-6, MP-4, SC-13 |
| `src/lib/server/secret-crypto.server.ts` | `/src/lib/server` | SC-13, SC-28, IA-5 |
| `src/lib/security-headers.ts` | `/src/lib` | SC-7, SC-8, SI-10 |
| `src/lib/net-guard.ts` | `/src/lib` | SC-7, SI-10 |
| `src/lib/server/cron-auth.server.ts` | `/src/lib/server` | AC-3, IA-5 |
| `vercel.json` | Root | SC-7, SC-8 |
| `src/routes/api/v1.$.ts` | `/src/routes/api` | AC-17, IA-8, AU-12, SI-10 |
| `src/lib/config.ts` | `/src/lib` | CM-2, CM-7, RA-3 |

---

## Compliance Posture Summary

| Framework | Status | Notes |
|-----------|--------|-------|
| NIST 800-53 Rev. 5 (Moderate) | **Substantial** | Technical controls in this repo; IR/CP operational processes still need tabletop + backups evidence |
| FedRAMP Moderate Baseline | **Not authorized** | This mapping and the code controls are prerequisites. Authorization requires a 3PAO, SSP, and ConMon — it is not something a code change confers |
| SOC 2 Type II (Provider) | **Inherited** | Vercel, Supabase, Daytona — all SOC 2 Type II |

---

## Next Steps for Full FedRAMP Authorization

1. **Complete POA&M items** (see table above)
2. **Generate SSP** (System Security Plan) from this document + `AGENTS.md`
3. **Conduct 3PAO Assessment** — engage FedRAMP-accredited 3PAO
4. **Implement FIPS 140-2 validated crypto** — evaluate for token/signing operations
5. **Formalize Incident Response** — tabletop exercise with team
6. **Continuous Monitoring Dashboard** — expose `/health` metrics to GRC tooling

---

*Last Updated: 2026-08-30*
*Version: 1.1*
*Classification: CONTROLLED UNCLASSIFIED INFORMATION (CUI)*