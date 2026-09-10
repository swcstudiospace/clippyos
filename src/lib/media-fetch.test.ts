import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ASSUMED_BYTES_PER_SEC,
  CRAYO_MIN_CLIPS_PER_JOB,
  DAYTONA_DOMAIN_ALLOWLIST_MAX,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_SEGMENT_SECONDS,
  hms,
  maxSegmentSeconds,
  parseMediaJobStatus,
  planMediaSegments,
  FETCHABLE_PAGE_HOSTS,
  MEDIA_MAX_SECONDS,
  mediaAssetFilename,
  mediaContentType,
  mediaFetchAllowlist,
  mediaProbeProblem,
  mediaSourceKind,
  parseMediaProbe,
} from "./media-fetch.ts";

test("mediaSourceKind routes page links to the sandbox fetch and files to Crayo import", () => {
  assert.equal(mediaSourceKind("https://www.youtube.com/watch?v=4GcCFZs9ZrA"), "fetch");
  assert.equal(mediaSourceKind("https://youtu.be/4GcCFZs9ZrA"), "fetch");
  assert.equal(mediaSourceKind("https://m.youtube.com/watch?v=x"), "fetch");
  assert.equal(mediaSourceKind("https://www.tiktok.com/@a/video/1"), "fetch");
  assert.equal(mediaSourceKind("https://www.twitch.tv/videos/123"), "fetch");
  assert.equal(mediaSourceKind("https://x.com/a/status/1"), "fetch");
  assert.equal(mediaSourceKind("https://cdn-crayo.com/user-uploads/x/long.mp4"), "direct");
  assert.equal(mediaSourceKind("https://os.swcstudio.space/api/library/file?t=abc"), "direct");
  assert.equal(mediaSourceKind("https://drive.google.com/file/d/abc/view"), null);
  assert.equal(mediaSourceKind("http://cdn.example.com/a.mp4"), null);
  assert.equal(mediaSourceKind("not a url"), null);
});

test("mediaFetchAllowlist opens only the source site's family plus install/upload hosts", () => {
  const yt = mediaFetchAllowlist("https://www.youtube.com/watch?v=x", ["uploads-abc.s3.amazonaws.com", "bad host!"]);
  assert.match(yt, /\*\.googlevideo\.com/);
  assert.match(yt, /uploads-abc\.s3\.amazonaws\.com/);
  assert.match(yt, /pypi\.org/);
  assert.doesNotMatch(yt, /tiktok|twimg|bad host/);
  const tt = mediaFetchAllowlist("https://www.tiktok.com/@a/video/1");
  assert.match(tt, /\*\.tiktokcdn\.com/);
  assert.doesNotMatch(tt, /googlevideo/);
});

test("mediaFetchAllowlist never exceeds Daytona's 20-domain cap", () => {
  for (const host of FETCHABLE_PAGE_HOSTS) {
    const list = mediaFetchAllowlist(`https://www.${host}/x`, ["uploads.example-s3.amazonaws.com"]);
    const n = list.split(",").length;
    assert.ok(n <= DAYTONA_DOMAIN_ALLOWLIST_MAX, `${host}: ${n} domains`);
  }
});

test("parseMediaProbe reads yt-dlp JSON, tolerating log noise and playlist wrappers", () => {
  const probe = parseMediaProbe('WARNING: something\n{"title":"  Long   form ","duration":1234.6,"ext":"mp4","uploader":"Chan"}');
  assert.deepEqual(probe, { title: "Long form", durationSec: 1235, ext: "mp4", uploader: "Chan" });
  const wrapped = parseMediaProbe('{"entries":[{"title":"First","duration":90,"ext":"webm"}]}');
  assert.equal(wrapped?.title, "First");
  assert.equal(wrapped?.ext, "webm");
  assert.equal(parseMediaProbe("PROBE_FAILED"), null);
});

test("mediaProbeProblem enforces Crayo's 1 minute to 3 hour window", () => {
  assert.match(mediaProbeProblem({ title: "", durationSec: 30, ext: null, uploader: null }) ?? "", /at least 60s/);
  assert.match(mediaProbeProblem({ title: "", durationSec: MEDIA_MAX_SECONDS + 1, ext: null, uploader: null }) ?? "", /3 hours/);
  assert.equal(mediaProbeProblem({ title: "", durationSec: 600, ext: null, uploader: null }), null);
  assert.equal(mediaProbeProblem({ title: "", durationSec: null, ext: null, uploader: null }), null);
});

test("mediaContentType and mediaAssetFilename match Crayo's accepted video formats", () => {
  assert.equal(mediaContentType("/tmp/mf/src.mp4"), "video/mp4");
  assert.equal(mediaContentType("/tmp/mf/src.webm"), "video/webm");
  assert.equal(mediaContentType("/tmp/mf/src.mkv"), "video/x-matroska");
  assert.equal(mediaContentType("/tmp/mf/src.flv"), null);
  assert.equal(mediaAssetFilename("iShowSpeed: HE SNAPPED!! (full stream)", "mp4"), "iShowSpeed-HE-SNAPPED-full-stream.mp4");
  assert.equal(mediaAssetFilename("", "webm"), "long-form.webm");
});

test("planMediaSegments keeps every segment under Crayo's 3 h and 1 GB limits", () => {
  const short = planMediaSegments({ durationSec: 45 * 60, clipCount: 5 });
  assert.equal(short?.segments.length, 1);
  assert.equal(short?.segments[0]?.endSec, null);
  assert.equal(short?.clipsPerSegment, 5);

  const sixHours = planMediaSegments({ durationSec: 6 * 3600, clipCount: 10 });
  assert.ok(sixHours);
  const segLen = maxSegmentSeconds();
  assert.ok(segLen <= MEDIA_MAX_SEGMENT_SECONDS);
  assert.ok(segLen * ASSUMED_BYTES_PER_SEC <= MEDIA_MAX_BYTES);
  for (const seg of sixHours!.segments) {
    assert.ok((seg.endSec ?? 0) - seg.startSec <= segLen + 1, `segment ${seg.index} too long`);
  }
  assert.equal(sixHours!.segments[0]?.startSec, 0);
  assert.equal(sixHours!.segments.at(-1)?.endSec, 6 * 3600);
  assert.ok(sixHours!.clipsPerSegment >= CRAYO_MIN_CLIPS_PER_JOB);
  assert.ok(sixHours!.totalClips >= 10);
  assert.equal(planMediaSegments({ durationSec: 20 * 3600, clipCount: 5 }), null);
});

test("hms and parseMediaJobStatus round-trip the sandbox contract", () => {
  assert.equal(hms(0), "00:00:00");
  assert.equal(hms(3 * 3600 + 5 * 60 + 9), "03:05:09");
  const status = parseMediaJobStatus('{"phase":"probed","probe":{"title":"T","durationSec":100},"segments":[]}');
  assert.equal(status?.phase, "probed");
  assert.equal(status?.probe?.durationSec, 100);
  assert.equal(parseMediaJobStatus("cat: /tmp/mf/status.json: No such file"), null);
});
