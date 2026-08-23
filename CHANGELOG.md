# Changelog

All notable changes to ClippyOS are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-08-23

### Added

- Enterprise repository bootstrap: README, LICENSE (MIT), CONTRIBUTING,
  SECURITY policy, Code of Conduct, Support guide, changelog, GitHub issue
  and PR templates, and an agent operating guide (`AGENTS.md`).
- Repository brand banner under `docs/assets/`.

### Security

- Removed embedded preview credential fallbacks from `startup.sh`,
  `src/lib/supabase/secrets.server.ts`, and
  `src/lib/server/higgsfield.server.ts`; credentials now resolve from the
  environment only. Operators must rotate any previously exposed values.

### Changed

- Vercel build output is no longer tracked: `.vercel/` added to `.gitignore`
  and previously committed artifacts removed from the index.

### Prior art (pre-bootstrap history)

- Agency workspace: clients, money, leads, calendar, team, onboarding,
  billing (`0001_auth.sql` … `0012_billing.sql`).
- Autonomy stack: agent loop, orchestration, skills, safety hooks, seats and
  seat audit (`0006_autonomy.sql`, `0009_skills.sql`, `0010_agent.sql`,
  `0011_agent_orchestration.sql`, `0028_automation_seats.sql`,
  `0029_seat_audit.sql`).
- Publishing rails: social jobs, publishers, TikTok post modes, IG
  containers, resumable uploads, asset library, YouTube publishing
  (`0007_social.sql` … `0022_youtube_publish.sql`).
- Integrations: Linear, liaison channels, demo requests, operator secrets,
  remote MCP, MCP OAuth 2.1 (`0023_linear.sql` … `0030_mcp_oauth.sql`).
