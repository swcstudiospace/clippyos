import assert from "node:assert/strict";
import { test } from "node:test";
import {
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

test("mediaFetchAllowlist adds the signed upload host and rejects junk", () => {
  const list = mediaFetchAllowlist(["uploads-abc.s3.amazonaws.com", "bad host!"]);
  assert.match(list, /\*\.googlevideo\.com/);
  assert.match(list, /uploads-abc\.s3\.amazonaws\.com/);
  assert.doesNotMatch(list, /bad host/);
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
