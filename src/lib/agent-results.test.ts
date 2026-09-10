import assert from "node:assert/strict";
import { test } from "node:test";
import { collectAgentVisualResults } from "./agent-results.ts";
import type { AgentRunDetail } from "./agent.ts";

function detail(partial: Partial<AgentRunDetail["run"]> & { iterations?: AgentRunDetail["iterations"] }): AgentRunDetail {
  return {
    clientName: "Ada",
    skillName: null,
    iterations: partial.iterations ?? [],
    run: {
      id: "r1",
      goal: "Make a short",
      preset: "custom",
      clientId: null,
      skillId: null,
      status: "succeeded",
      model: "grok-4.6",
      provider: "xai-oauth",
      summary: partial.summary ?? null,
      errorCode: null,
      iterationCount: 1,
      plan: null,
      outputs: partial.outputs ?? null,
      idempotencyKey: null,
      cancelRequested: false,
      deadlineAt: null,
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:01:00.000Z",
      createdBy: null,
      triggeredByTeamMemberId: null,
      ...partial,
    },
  };
}

test("collects Crayo video URLs and ideas from outputs", () => {
  const result = collectAgentVisualResults(
    detail({
      summary: "Done. https://cdn-crayo.com/user-uploads/x/video.mp4",
      outputs: {
        ideas: { ideas: [{ title: "Hook one", rationale: "Curiosity gap" }] },
        image: { url: "https://cdn-crayo.com/user-uploads/x/image.png" },
      },
    }),
  );
  assert.equal(result.empty, false);
  assert.ok(result.media.some((row) => row.kind === "video"));
  assert.ok(result.media.some((row) => row.kind === "image"));
  assert.equal(result.ideas[0]?.title, "Hook one");
});

test("empty run has no visual results", () => {
  const result = collectAgentVisualResults(detail({ summary: null, outputs: null }));
  assert.equal(result.empty, true);
});
