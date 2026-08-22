import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { MASKED_SECRET } from "@/lib/constants";
import { requireAdmin } from "@/lib/server/access";

/**
 * AppSetting FLS: value is never returned to the client in plaintext.
 * Admin-only. Empty database remains empty until keys are saved.
 */
export const listSettingsMasked = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    try {
      const { tryCreateAdminClient, createPublishableClient } = await import(
        "@/lib/supabase/clients.server"
      );
      const client = tryCreateAdminClient() ?? createPublishableClient();
      const { data, error } = await client.from("app_settings").select("key").order("key");
      if (!error) {
        return (data ?? []).map((row) => ({
          key: String((row as { key?: string }).key ?? ""),
          value: MASKED_SECRET,
        }));
      }
    } catch {
      /* fall through to local store */
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ key: string }>`
      select key from app_settings order by key
    `;
    return rows.map((row) => ({ key: row.key, value: MASKED_SECRET }));
  });

/** Connection health for the agency's Supabase project. Signed-in operators only. */
export const getSupabaseStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { probeSupabase } = await import("@/lib/supabase/probe.server");
    return probeSupabase(context.userId);
  });

const HiggsfieldSaveSchema = z.object({
  keyId: z.string().trim().min(8).max(200),
  secret: z.string().trim().min(8).max(400),
});

/**
 * Store Higgsfield key id + secret in AppSetting. Values never leave the server
 * in the response. Admin-gated (FLS).
 */
export const saveHiggsfieldCredentials = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => HiggsfieldSaveSchema.parse(input))
  .handler(async ({ data }) => {
    const { persistHiggsfieldCreds, clearHiggsfieldCredsCache } = await import(
      "@/lib/server/higgsfield.server"
    );
    await persistHiggsfieldCreds({ key: data.keyId, secret: data.secret });
    clearHiggsfieldCredsCache();
    return { ok: true as const };
  });

const YoutubeKeySchema = z.object({
  apiKey: z.string().trim().min(8).max(200),
});

export const saveYoutubeApiKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => YoutubeKeySchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { persistYoutubeApiKey } = await import("@/lib/server/youtube-data.server");
    await persistYoutubeApiKey(data.apiKey);
    return { ok: true as const };
  });

export const startGrokOAuth = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { startGrokDeviceLogin } = await import("@/lib/server/xai.server");
    return startGrokDeviceLogin();
  });

export const pollGrokOAuth = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { pollGrokDeviceLogin } = await import("@/lib/server/xai.server");
    return pollGrokDeviceLogin();
  });

export const disconnectGrokOAuthFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { disconnectGrokOAuth } = await import("@/lib/server/xai.server");
    await disconnectGrokOAuth();
    return { ok: true as const };
  });
