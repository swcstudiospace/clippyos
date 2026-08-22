import {
  createAdminClient,
  createContextClient,
  resolveEnv,
} from "@supabase/server/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_JWKS_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./public";
import { getSupabaseSecret } from "./secrets.server";

export function hasSupabaseSecret(): boolean {
  return Boolean(getSupabaseSecret());
}

export function getSupabaseEnvOverrides() {
  const secret = getSupabaseSecret();
  return {
    url: SUPABASE_URL,
    publishableKeys: { default: SUPABASE_PUBLISHABLE_KEY },
    jwks: new URL(SUPABASE_JWKS_URL),
    ...(secret ? { secretKeys: { default: secret } } : {}),
  };
}

export function getResolvedSupabaseEnv() {
  return resolveEnv(getSupabaseEnvOverrides());
}

/** RLS-scoped client (anon / user JWT). Use for health probes, not financial writes. */
export function createPublishableClient(): SupabaseClient {
  return createContextClient({ env: getSupabaseEnvOverrides() }) as SupabaseClient;
}

/** Bypasses RLS. Null when the secret key is not configured on the server. */
export function tryCreateAdminClient(): SupabaseClient | null {
  if (!hasSupabaseSecret()) return null;
  try {
    return createAdminClient({ env: getSupabaseEnvOverrides() }) as SupabaseClient;
  } catch {
    return null;
  }
}
