import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireSecretEditor } from "@/lib/server/access";
import type { PublisherSnapshot } from "@/lib/publishers";
import type { PublisherId } from "@/lib/server/social-oauth.server";

const ProviderSchema = z.enum(["x", "tiktok", "instagram", "youtube"]);

export const getSocialPublishers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<PublisherSnapshot> => {
    const { getPublisherSnapshot } = await import("@/lib/server/social-publish.server");
    return getPublisherSnapshot(context.userId);
  });

export const savePublisherAppFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        provider: ProviderSchema,
        clientId: z.string().min(6).max(200),
        clientSecret: z.string().min(6).max(400),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { persistPublisherApp } = await import("@/lib/server/social-oauth.server");
    await persistPublisherApp(data.provider, {
      clientId: data.clientId,
      clientSecret: data.clientSecret,
    });
    try {
      const { onIntegrationChanged } = await import("@/lib/server/safety-hooks.server");
      await onIntegrationChanged({
        actorId: context.userId,
        provider: data.provider,
        action: "connected",
      });
    } catch {
      /* */
    }
    return { ok: true as const };
  });

export const startPublisherOAuthFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ provider: ProviderSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { startPublisherOAuth } = await import("@/lib/server/social-oauth.server");
    return startPublisherOAuth({ provider: data.provider, userId: context.userId });
  });

export const testPublisherFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ provider: ProviderSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { testPublisherConnection } = await import("@/lib/server/social-oauth.server");
    try {
      await testPublisherConnection(data.provider as PublisherId);
      return { ok: true as const };
    } catch (error) {
      try {
        const { onIntegrationTestFailed } = await import("@/lib/server/safety-hooks.server");
        await onIntegrationTestFailed({
          actorId: context.userId,
          provider: data.provider,
          reason: error instanceof Error ? error.message : undefined,
        });
      } catch {
        /* */
      }
      throw error;
    }
  });

export const disconnectPublisherFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        provider: ProviderSchema,
        tokensOnly: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { clearPublisher, disconnectPublisherTokens } = await import(
      "@/lib/server/social-oauth.server"
    );
    if (data.tokensOnly || data.provider === "x" || data.provider === "tiktok" || data.provider === "instagram" || data.provider === "youtube") {
      await disconnectPublisherTokens(data.provider);
    } else await clearPublisher(data.provider);
    try {
      const { onIntegrationChanged } = await import("@/lib/server/safety-hooks.server");
      await onIntegrationChanged({
        actorId: context.userId,
        provider: data.provider,
        action: "disconnected",
      });
    } catch {
      /* */
    }
    return { ok: true as const };
  });

export const selectInstagramAccountFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ igUserId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { selectInstagramAccount } = await import("@/lib/server/social-oauth.server");
    await selectInstagramAccount(data.igUserId);
    return { ok: true as const };
  });

export const setTikTokModeFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ mode: z.enum(["inbox", "direct"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { setTikTokPublishMode } = await import("@/lib/server/social-oauth.server");
    await setTikTokPublishMode(data.mode);
    return { ok: true as const };
  });

export const setTikTokAuditFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ status: z.enum(["UNAUDITED", "AUDITED", "UNKNOWN"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { setTikTokAuditStatus } = await import("@/lib/server/social-oauth.server");
    await setTikTokAuditStatus(data.status);
    return { ok: true as const };
  });

export const setTikTokDomainFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ domain: z.string().max(200) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { setTikTokVerifiedDomain } = await import("@/lib/server/social-oauth.server");
    await setTikTokVerifiedDomain(data.domain);
    return { ok: true as const };
  });

export const setYoutubePublishDefaultsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        categoryId: z.string().max(8).optional(),
        privacyDefault: z.enum(["private", "unlisted", "public"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireSecretEditor(context.userId);
    const { persistYoutubePublishDefaults } = await import("@/lib/server/social-oauth.server");
    await persistYoutubePublishDefaults(data);
    return { ok: true as const };
  });
