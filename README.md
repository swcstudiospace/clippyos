# ClippyOS

Autonomous Operating System for Clipping. Globally reachable control plane; Windows Social Machine for X, YouTube, Instagram, and TikTok; files in immutable cloud storage; optional content pins. Public landing → Get Access → checkout, or Request a Demo.

## What runs where

| Layer | Where | Role |
|---|---|---|
| Marketing / login | Vercel | Public `/`, Get Access `/login`, OS `/home` |
| App / API / MCP | Vercel (TanStack Start) | Clients, library, publishers, approvals, Hermes tools |
| Liaison inbox | Vercel | Telegram Bot API + WhatsApp Cloud API |
| Database | Supabase / Postgres | RLS-backed agency data |
| Clip files | **Supabase Storage** (`clippy-library`) or optional **Filebase/S3** | Survives deploys. Never the Windows VM. |
| IPFS | Pinata pin / Filebase CID | Pin layer only — never the write backend |
| Social Machine | Daytona **windows-large** (4 vCPU / 16 GiB / 50 GiB) | Computer Use only. Hibernate = pause (hot snapshot). |
| Skill / render sandboxes | Short-lived Daytona Linux jobs | Isolated from browser profiles |

Daytona’s 50 GiB disk is for Windows browser profiles and hot snapshots — not your asset library. The Grok preview sandbox is also not production storage.

## Social Machine (Windows)

- Snapshot: `windows-large` (falls back to `windows-medium` if quota blocks large). Existing undersized VMs are hot-resized to 4 vCPU / 16 GiB.
- Idle: **pause**, not destroy. Resume picks up cookies, Edge/Chrome, and open windows.
- Hibernate captures a named snapshot **while the VM is still running**, then pauses. Never delete.
- Clock/locale: `Australia/Sydney` / `en-AU` (Windows GeoId 12, UI language en-AU).
- Regions: Daytona only offers **us** and **eu**. There is no Australia region. Instagram often challenges logins from datacenter IPs even with an AU clock. Prefer Instagram Graph API, or set a **residential AU HTTPS proxy** (host/port/user — Test proxy uses undici and never starts a VM).
- Test Connection never starts a VM. Cron never starts a VM.

## Storage (Vercel has no disk)

1. **Supabase Storage** — default. Create a private bucket `clippy-library` if the app cannot create it.
2. **Filebase** (5 GB free, S3 + IPFS) or **Storj** / Cloudflare R2 — optional overflow in Settings → Media pipeline.
3. **Pinata** — optional pin after write. Gateway defaults to `https://ipfs.filebase.io/ipfs/`. Never store clips on the Social Machine.

## Liaison channels

Telegram and WhatsApp are professional customer/company channels. Inbox is `/inbox`. Webhooks: `/api/webhooks/telegram`, `/api/webhooks/whatsapp`. Computer Use is never used for these chats.

## Environment (Vercel + Supabase)

Set these in the Vercel project (never commit a `.env`):

- `DATABASE_URL` / Supabase URL + keys
- `SUPABASE_SERVICE_ROLE_KEY` — required for Storage
- `BETTER_AUTH_SECRET`
- `CRON_SECRET` — Vercel Cron (`/api/cron/ops` every 15 minutes; never starts the VM)
- Optional: `LIBRARY_S3_*` for Filebase/Storj/R2, `PINATA_JWT` for IPFS pins
- Operator-saved in Settings (not env): Daytona API key, residential proxy, publisher OAuth, Linear, Telegram, WhatsApp

## Local / preview

`npm run dev` (port contract is owned by the host). `npm test`, `npm run typecheck`, `npm run build`.

## GitHub + Vercel

This repo is production-shaped: no secrets in git, migrations under `migrations/`, Vercel preset already in Vite, CI on `npm test` + `npm run typecheck`. Push and connect the Vercel project to the same GitHub remote. Health: `GET /api/health` (never starts the Social Machine).
