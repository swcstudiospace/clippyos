import assert from "node:assert/strict";
import { test } from "node:test";
import {
  autoclipSourceProblem,
  buildCrayoAutoclipGoal,
  buildCrayoExportGoal,
  buildCrayoImageGoal,
  buildCrayoImportGoal,
  buildCrayoIngestGoal,
  buildCrayoShortGoal,
  buildCrayoVoiceoverGoal,
  crayoAutoclipFieldsFromGoal,
  crayoExportFieldsFromGoal,
  crayoImageFieldsFromGoal,
  crayoImportFieldsFromGoal,
  crayoIngestFieldsFromGoal,
  crayoShortFieldsFromGoal,
  crayoVoiceoverFieldsFromGoal,
  isCrayoMediaUrl,
} from "./agent-crayo.ts";

test("Crayo short goal names the pipeline and never asks for a key", () => {
  const goal = buildCrayoShortGoal({
    topic: "Morning habits",
    script: "Three habits that ruin mornings.",
    clientName: "Ada",
  });
  assert.match(goal, /9:16/);
  assert.match(goal, /Ada/);
  assert.match(goal, /run_short/);
  assert.match(goal, /ingest_to_library/);
  assert.doesNotMatch(goal, /crayo_sk_/);
  assert.match(goal, /Never echo the API key/);
});

test("Crayo AutoClip goal includes the source URL and clip count", () => {
  const goal = buildCrayoAutoclipGoal({
    url: "https://example.com/long.mp4",
    clipCount: 5,
  });
  assert.match(goal, /https:\/\/example.com\/long\.mp4/);
  assert.match(goal, /clip_count=5/);
  assert.match(goal, /run_autoclip/);
  assert.doesNotMatch(goal, /Social Machine start/i);
});

test("goal parsers pull topic, script, URL, and clip count", () => {
  const short = buildCrayoShortGoal({ topic: "Hooks", script: "Say this.", clientName: "Ada" });
  const fields = crayoShortFieldsFromGoal(short);
  assert.equal(fields.prompt, "Hooks");
  assert.match(fields.script, /Say this/);
  const auto = buildCrayoAutoclipGoal({ url: "https://youtu.be/abc", clipCount: 8 });
  const clip = crayoAutoclipFieldsFromGoal(auto);
  assert.equal(clip.url, "https://youtu.be/abc");
  assert.equal(clip.clipCount, 8);
});

test("voiceover image import export ingest goals parse without secrets", () => {
  const voice = buildCrayoVoiceoverGoal({ script: "Hello world.", voiceId: "vox_1", title: "Hook" });
  assert.match(voice, /generate_voiceover/);
  assert.doesNotMatch(voice, /crayo_sk_/);
  const vo = crayoVoiceoverFieldsFromGoal(voice);
  assert.equal(vo.script, "Hello world.");
  assert.equal(vo.voiceId, "vox_1");
  assert.equal(vo.title, "Hook");
  const image = buildCrayoImageGoal({ prompt: "neon skyline", aspectRatio: "9:16" });
  assert.equal(crayoImageFieldsFromGoal(image).prompt, "neon skyline");
  const imported = buildCrayoImportGoal({ url: "https://example.com/a.mp4", name: "long" });
  assert.equal(crayoImportFieldsFromGoal(imported).url, "https://example.com/a.mp4");
  const exported = buildCrayoExportGoal({ projectId: "proj_9" });
  assert.equal(crayoExportFieldsFromGoal(exported).projectId, "proj_9");
  const ingested = buildCrayoIngestGoal({ url: "https://cdn-crayo.com/x.mp4", title: "Clip" });
  assert.equal(crayoIngestFieldsFromGoal(ingested).title, "Clip");
});

test("only Crayo CDN hosts count as ingestable media", () => {
  assert.equal(isCrayoMediaUrl("https://cdn-crayo.com/user-uploads/x/video.mp4"), true);
  assert.equal(isCrayoMediaUrl("https://uploads.crayo.ai/a.png"), true);
  assert.equal(isCrayoMediaUrl("https://example.com/video.mp4"), false);
  assert.equal(isCrayoMediaUrl("http://cdn-crayo.com/x.mp4"), false);
});

test("autoclipSourceProblem refuses only what nothing can fetch unattended", () => {
  assert.match(autoclipSourceProblem("https://drive.google.com/file/d/abc/view") ?? "", /drive\.google\.com/);
  assert.match(autoclipSourceProblem("https://www.dropbox.com/s/abc/x.mp4?dl=0") ?? "", /dropbox\.com/);
  assert.match(autoclipSourceProblem("http://cdn.example.com/a.mp4") ?? "", /https/);
  assert.match(autoclipSourceProblem("not a url") ?? "", /valid https/);
  assert.match(autoclipSourceProblem("") ?? "", /Paste/);
});

test("autoclipSourceProblem accepts direct file links and fetchable page links", () => {
  assert.equal(autoclipSourceProblem("https://cdn-crayo.com/user-uploads/x/long.mp4"), null);
  assert.equal(autoclipSourceProblem("https://os.swcstudio.space/api/library/file?t=abc"), null);
  assert.equal(autoclipSourceProblem("https://files.example.com/podcast-episode.mov"), null);
  assert.equal(autoclipSourceProblem("https://www.youtube.com/watch?v=4GcCFZs9ZrA"), null);
  assert.equal(autoclipSourceProblem("https://youtu.be/4GcCFZs9ZrA"), null);
  assert.equal(autoclipSourceProblem("https://www.tiktok.com/@a/video/1"), null);
});
