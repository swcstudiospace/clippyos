# Clips to Library: export, store, preview, download

**Date:** 2026-09-16
**Status:** approved in chat (brainstorming), pending written review
**Sub-project:** 1 of 3 in the Crayo pipeline rebuild (2: VPS media worker replacing Daytona fetch; 3: verify remaining Crayo commands)

## Problem

`/autoclip` never yields a video. When Crayo finishes an AutoClip, both callers
(`runAutoclip` in `src/lib/server/crayo-tools.server.ts` and the background job's
final phase in `src/lib/server/media-fetch-job.server.ts`) ingest only each clip's
`thumbnail_url`. The clips exist as Crayo `project_id`s that are never exported, so the
Library receives JPGs, not mp4s. There is also no way to download finished media:
`/api/library/file` forces `content-disposition: inline` and only caption sidecars have a
Download button.

## Decisions already made

- Heavy fetching (YouTube etc.) will move to an always-on worker on the VPS (sub-project 2).
  This sub-project does not touch fetching or Daytona.
- Finished clips are stored in Supabase Storage (bucket `clippy-library`, already the default
  backend in `src/lib/server/library-storage.server.ts`), shown in the Library with the existing
  player, and downloadable from there. No automatic copy to the operator's computer.

## Architecture and data flow

1. AutoClip reports done with N clips, each a Crayo `project_id`.
2. For each clip the app starts a Crayo export (`POST /projects/{id}/export`) and polls
   `GET /exports/{id}` in bounded steps until it returns an mp4 URL.
3. The mp4 is streamed from Crayo's CDN into the library bucket through a new streaming write
   path, so no clip is buffered in a Vercel function's memory. The Library asset row records the
   clip title, duration, source URL, run id, segment index, and Crayo project id. The thumbnail is
   attached to the same asset (no separate JPG asset).
4. The run's results list the library asset ids; the Agent results panel and Library cards render
   the clip with the existing `<video>` player plus a Download button.

One new server module owns "clip project → stored library asset" so both callers share it.
The background job gains a phase `exporting` between `autoclipping` and `done`; the tick loop
drives exports the same bounded, resumable way it drives uploads.

## Components and interfaces

### `src/lib/server/clip-export.server.ts` (new)

- `exportClipToLibrary(input)`: `{ projectId, title, source: { runId, clientId, sourceUrl, segmentIndex }, actorId }`
  → `{ assetId, bytes, durationSec }`. Starts the export, polls, streams to storage, attaches the
  thumbnail. Idempotent: the asset row is keyed on `projectId`; a retry finds the existing asset.
- `exportClipStep(state)`: resumable single step for the job. Advances one clip one transition
  (start export → poll → store) and returns the updated per-clip state.
- Both take the Crayo client as a parameter (default: the real one) so tests inject a fake.

### `src/lib/server/library-storage.server.ts`

- New `writeLibraryStream(key, contentType, sizeHint, body: Readable)` next to the bytes writer.
  Same backend chain and order (Supabase Storage → S3-compatible → local disk). The local spool copy
  is skipped for streamed writes. The asset row records which backend holds the file.

### `src/lib/server/media-fetch-job.server.ts`

- `MediaFetchJobState.phase` gains `"exporting"`. Each segment gains
  `clips: { projectId, title, thumbnailUrl, exportId?, exportStatus: "pending" | "exporting" | "stored" | "failed", assetId?, error? }[]`.
- The tick enters `exporting` once every segment's AutoClip is done, runs at most two clip exports
  concurrently, and moves to `done` when every clip is `stored` or `failed`.
- The thumbnail-only ingest is removed, not kept as a fallback.

### `src/lib/server/crayo-tools.server.ts`

- `runAutoclip` (synchronous path, direct mp4 links) calls `exportClipToLibrary` per clip after
  its existing AutoClip poll. `/export` (`crayo.export_project`) reuses the same function so a
  manual export also lands in the Library.

### UI

- `src/routes/api/library.file.ts`: `download=1` query → `content-disposition: attachment`,
  filename = clip title (sanitised) + extension.
- `src/components/library/asset-card.tsx`, `asset-drawer.tsx`, `src/components/agent/results.tsx`:
  a Download button linking to the signed URL with `download=1`. Agent results also get a Retry
  button on a failed clip (calls `exportClipToLibrary` again).
- Cards say which backend holds the file (replaces the misleading "Filebase library" copy where it
  appears on these surfaces).

## Error handling and spend control

- **Spend guard:** before exporting, read export credits (same call as `/account`). If credits <
  clips, stop with a message naming both numbers; export nothing; keep the AutoClip result
  viewable. Hard ceiling of 10 exports per run.
- **Export failures:** a failed or timed-out export marks only that clip failed with Crayo's
  message; the run continues. The summary lists succeeded and failed clips by title.
- **Storage failures:** on a mid-stream failure the partial object is deleted and the clip is
  marked failed with the storage error. Backend fallback chain applies.
- **Size:** check Crayo's reported export size against the bucket limit (512 MB) before streaming.
- **Visibility:** every step writes a progress line to the run ("Exporting clip 2 of 3",
  "Stored clip 2 of 3 (34 MB)"). Transient polling errors surface via the PR #50 mechanism.

## Testing

- `src/lib/server/clip-export.test.ts` (node:test): spend guard; `exportClipStep` transitions
  against a fake Crayo client (pending → done → stored; failed export; storage error cleans up;
  retry with existing export id is a no-op); idempotent lookup by project id.
- `src/lib/media-fetch.test.ts`: job-state parser accepts the `exporting` phase and clip entries.
- First tests for `crayo.server.ts`: export start and export poll response shaping from fixtures.
- `writeLibraryStream`: 20 MB generated stream to the local-disk backend; size check; cleanup on
  abort.
- Integration on local dev (headless Firefox): `/autoclip` on a direct mp4 link with 2 clips →
  playable clip in Library → Download returns an attachment with the right filename. Credit cost
  stated in the PR.

## Rollout

One PR, no feature flag. Old thumbnail-only ingest removed.

## Out of scope

YouTube/page fetching and Daytona (sub-project 2); `/short`, `/voice`, `/image`, `/import`,
`/ingest` verification (sub-project 3); any copy to the operator's machine.
