import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  PERFORMANCE_PLATFORMS,
  PERFORMANCE_WINDOWS,
  PROPOSAL_STATUSES,
  parseMetrics,
  type AssetPerformanceRollup,
  type KnowledgeProposal,
  type LearningPolicy,
  type MetricsApiStatus,
  type PostPerformance,
} from "@/lib/performance";
import { getUserRole } from "@/lib/server/access";

async function requireUser(userId: string) {
  const role = await getUserRole(userId);
  if (!role) throw new Error("Forbidden");
  return role;
}

export const getPerformanceSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{
    posts: PostPerformance[];
    rollups: AssetPerformanceRollup[];
    proposals: KnowledgeProposal[];
    policy: LearningPolicy;
    metricsApi: MetricsApiStatus;
  }> => {
    await requireUser(context.userId);
    try {
      const { sweepDuePerformanceFetches } = await import("@/lib/server/performance-fetch.server");
      await sweepDuePerformanceFetches(8).catch(() => 0);
      const { listPostPerformance, listAssetRollups, readLearningPolicy } = await import(
        "@/lib/server/performance.server"
      );
      const { listKnowledgeProposals } = await import("@/lib/server/knowledge-proposals.server");
      const { metricsApiStatus } = await import("@/lib/server/performance-fetch.server");
      const [posts, rollups, proposals, policy, metricsApi] = await Promise.all([
        listPostPerformance({ limit: 200 }),
        listAssetRollups(),
        listKnowledgeProposals({ limit: 80 }),
        readLearningPolicy(),
        metricsApiStatus(),
      ]);
      return { posts, rollups, proposals, policy, metricsApi };
    } catch {
      const { DEFAULT_LEARNING_POLICY } = await import("@/lib/performance");
      return {
        posts: [],
        rollups: [],
        proposals: [],
        policy: { ...DEFAULT_LEARNING_POLICY },
        metricsApi: { youtube: false, x: false, tiktok: false, instagram: false },
      };
    }
  });

export const listWinnersFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        clientId: z.string().optional(),
        platform: z.enum(PERFORMANCE_PLATFORMS).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { listWinners } = await import("@/lib/server/performance.server");
    return { winners: await listWinners(data) };
  });

export const refreshPostPerformanceFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        socialPostId: z.string().optional(),
        sweep: z.boolean().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const fetch = await import("@/lib/server/performance-fetch.server");
    if (data.sweep) {
      const due = await fetch.sweepDuePerformanceFetches(12);
      const stale = await fetch.sweepStalePublishedPosts();
      const { distillWinnersToProposals } = await import("@/lib/server/knowledge-proposals.server");
      const distilled = await distillWinnersToProposals(context.userId, 3).catch(() => 0);
      return { ok: true as const, due, stale, distilled };
    }
    if (!data.socialPostId) throw new Error("POST_MISSING");
    const result = await fetch.refreshPostById(data.socialPostId, context.userId);
    if (!result.ok) throw new Error(result.reason ?? "METRICS_UNAVAILABLE");
    return { ok: true as const, due: 0, stale: 0 };
  });

export const recordManualMetricsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        socialPostId: z.string().optional(),
        clientId: z.string().nullable().optional(),
        platform: z.enum(PERFORMANCE_PLATFORMS),
        externalPostId: z.string().min(1).max(200),
        externalUrl: z.string().max(500).nullable().optional(),
        mediaAssetId: z.string().nullable().optional(),
        window: z.enum(PERFORMANCE_WINDOWS).default("LIFETIME"),
        metrics: z.object({
          views: z.number().nonnegative().nullable().optional(),
          likes: z.number().nonnegative().nullable().optional(),
          comments: z.number().nonnegative().nullable().optional(),
          shares: z.number().nonnegative().nullable().optional(),
          saves: z.number().nonnegative().nullable().optional(),
          watchTimeSec: z.number().nonnegative().nullable().optional(),
          avgWatchPct: z.number().nonnegative().nullable().optional(),
          impressions: z.number().nonnegative().nullable().optional(),
          clicks: z.number().nonnegative().nullable().optional(),
          ctr: z.number().nonnegative().nullable().optional(),
        }),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { upsertPostPerformance } = await import("@/lib/server/performance.server");
    const metrics = parseMetrics(data.metrics);
    const hasAny = Object.values(metrics).some((n) => n != null);
    if (!hasAny) throw new Error("METRICS_EMPTY");
    let publishedAt: string | null = null;
    let socialJobId: string | null = null;
    let mediaAssetId = data.mediaAssetId ?? null;
    let clientId = data.clientId ?? null;
    let externalUrl = data.externalUrl ?? null;
    if (data.socialPostId) {
      const { readSocialPosts } = await import("@/lib/server/social");
      const post = (await readSocialPosts()).find((row) => row.id === data.socialPostId);
      if (post) {
        publishedAt = post.createdAt;
        socialJobId = post.jobId;
        mediaAssetId = mediaAssetId ?? post.contentRef;
        clientId = clientId ?? post.clientId;
        externalUrl = externalUrl ?? post.externalUrl;
      }
    }
    const snapshot = await upsertPostPerformance({
      clientId,
      socialJobId,
      socialPostId: data.socialPostId ?? null,
      platform: data.platform,
      externalPostId: data.externalPostId,
      externalUrl,
      mediaAssetId,
      publishedAt,
      metrics,
      metricsSource: "MANUAL",
      window: data.window,
      createdBy: context.userId,
    });
    try {
      const { writeAuditEvent } = await import("@/lib/server/audit.server");
      await writeAuditEvent({
        actorUserId: context.userId,
        actorType: "USER",
        action: "performance.fetched",
        entityType: "post_performance",
        entityId: snapshot.id,
        clientId: snapshot.clientId,
        summary: "Manual performance snapshot",
        metadata: { source: "MANUAL", window: snapshot.window, views: snapshot.metrics.views },
      });
    } catch {
      /* ok */
    }
    try {
      const { maybeProposeFromWinner } = await import("@/lib/server/knowledge-proposals.server");
      await maybeProposeFromWinner(snapshot, context.userId);
    } catch {
      /* ok */
    }
    return snapshot;
  });

export const proposeKnowledgeFromAssetFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ assetId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { listPostPerformance, listWinners } = await import("@/lib/server/performance.server");
    const rows = await listPostPerformance({ mediaAssetId: data.assetId, limit: 50 });
    const winner = rows.find((row) => row.verdict === "WINNER") ?? (await listWinners()).find((row) => row.mediaAssetId === data.assetId) ?? rows[0];
    if (!winner) throw new Error("NO_PERFORMANCE");
    const { createProposalFromPerformance } = await import("@/lib/server/knowledge-proposals.server");
    const proposal = await createProposalFromPerformance(winner, context.userId, { force: true });
    if (!proposal) throw new Error("PROPOSAL_DUPLICATE");
    return proposal;
  });

export const listKnowledgeProposalsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        status: z.enum(PROPOSAL_STATUSES).optional(),
        clientId: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { listKnowledgeProposals } = await import("@/lib/server/knowledge-proposals.server");
    return { items: await listKnowledgeProposals(data) };
  });

export const decideKnowledgeProposalFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        decision: z.enum(["APPROVED", "REJECTED"]),
        note: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const { decideProposal } = await import("@/lib/server/knowledge-proposals.server");
    return decideProposal({
      id: data.id,
      decision: data.decision,
      actorId: context.userId,
      note: data.note,
    });
  });

export const getLearningPolicyFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireUser(context.userId);
    const { readLearningPolicy } = await import("@/lib/server/performance.server");
    const { metricsApiStatus } = await import("@/lib/server/performance-fetch.server");
    const [policy, metricsApi] = await Promise.all([readLearningPolicy(), metricsApiStatus()]);
    return { policy, metricsApi };
  });

export const saveLearningPolicyFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        enabled: z.boolean(),
        autoMerge: z.boolean(),
        winnerPercentile: z.number().int().min(50).max(99),
        minScore: z.number().int().min(0).max(100),
        minViews: z.number().int().min(0).max(1_000_000),
        fetchDelaysHours: z.array(z.number().min(0).max(720)).max(6),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const { writeLearningPolicy } = await import("@/lib/server/performance.server");
    return writeLearningPolicy(data);
  });
