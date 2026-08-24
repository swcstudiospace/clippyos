/**
 * Configuration module that provides centralized access to configurable constants.
 * Values can be overridden via app_settings table (workspace control keys) with
 * fallbacks to the hardcoded constants in constants.ts.
 * This enables NIST/FedRAMP compliance by making all security-relevant
 * thresholds configurable without code changes.
 */

import {
  GUARANTEE_WINDOW_DAYS as DEFAULT_GUARANTEE_WINDOW_DAYS,
  GUARANTEE_WARNING_DAY as DEFAULT_GUARANTEE_WARNING_DAY,
  PIPELINE_STALL_DAYS as DEFAULT_PIPELINE_STALL_DAYS,
  CAPACITY_OVERLOAD_THRESHOLD as DEFAULT_CAPACITY_OVERLOAD_THRESHOLD,
  MARK_COLLECTED_CONFIRM_THRESHOLD as DEFAULT_MARK_COLLECTED_CONFIRM_THRESHOLD,
  DISCORD_AGENT_STALE_MS as DEFAULT_DISCORD_AGENT_STALE_MS,
  DASHBOARD_ACTIVITY_LIMIT as DEFAULT_DASHBOARD_ACTIVITY_LIMIT,
  BRAND_ACCENT_HEX as DEFAULT_BRAND_ACCENT_HEX,
} from "@/lib/constants";

let cachedConfig: Config | null = null;

export type Config = {
  guaranteeWindowDays: number;
  guaranteeWarningDay: number;
  pipelineStallDays: number;
  capacityOverloadThreshold: number;
  markCollectedConfirmThreshold: number;
  discordAgentStaleMs: number;
  dashboardActivityLimit: number;
  brandAccentHex: string;
};

/**
 * Parse a string value to number with validation and fallback.
 */
function parseConfigNumber(value: string | null, fallback: number, min?: number, max?: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return fallback;
  if (min !== undefined && parsed < min) return fallback;
  if (max !== undefined && parsed > max) return fallback;
  return parsed;
}

/**
 * Parse a string value with validation and fallback.
 */
function parseConfigString(value: string | null, fallback: string, validator?: (v: string) => boolean): string {
  if (!value) return fallback;
  if (validator && !validator(value)) return fallback;
  return value;
}

/**
 * Validates hex color format (#RRGGBB or #RGB)
 */
function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?$/.test(value);
}

/**
 * Load configuration from app settings with fallbacks to constants.
 * This function is memoized - subsequent calls return cached config.
 */
export async function loadConfig(): Promise<Config> {
  if (cachedConfig) return cachedConfig;

  // Dynamic import to avoid circular dependencies
  const { readAppSetting } = await import("@/lib/server/app-settings.server");

  const [
    guaranteeWindowDays,
    guaranteeWarningDay,
    pipelineStallDays,
    capacityOverloadThreshold,
    markCollectedConfirmThreshold,
    discordAgentStaleMs,
    dashboardActivityLimit,
    brandAccentHex,
  ] = await Promise.all([
    readAppSetting("GUARANTEE_WINDOW_DAYS"),
    readAppSetting("GUARANTEE_WARNING_DAY"),
    readAppSetting("PIPELINE_STALL_DAYS"),
    readAppSetting("CAPACITY_OVERLOAD_THRESHOLD"),
    readAppSetting("MARK_COLLECTED_CONFIRM_THRESHOLD"),
    readAppSetting("DISCORD_AGENT_STALE_MS"),
    readAppSetting("DASHBOARD_ACTIVITY_LIMIT"),
    readAppSetting("BRAND_ACCENT_HEX"),
  ]);

  cachedConfig = {
    guaranteeWindowDays: parseConfigNumber(guaranteeWindowDays, DEFAULT_GUARANTEE_WINDOW_DAYS, 1, 365),
    guaranteeWarningDay: parseConfigNumber(guaranteeWarningDay, DEFAULT_GUARANTEE_WARNING_DAY, 1, 365),
    pipelineStallDays: parseConfigNumber(pipelineStallDays, DEFAULT_PIPELINE_STALL_DAYS, 1, 90),
    capacityOverloadThreshold: parseConfigNumber(capacityOverloadThreshold, DEFAULT_CAPACITY_OVERLOAD_THRESHOLD, 1, 20),
    markCollectedConfirmThreshold: parseConfigNumber(markCollectedConfirmThreshold, DEFAULT_MARK_COLLECTED_CONFIRM_THRESHOLD, 0, 100000),
    discordAgentStaleMs: parseConfigNumber(discordAgentStaleMs, DEFAULT_DISCORD_AGENT_STALE_MS, 60000, 86400000),
    dashboardActivityLimit: parseConfigNumber(dashboardActivityLimit, DEFAULT_DASHBOARD_ACTIVITY_LIMIT, 1, 100),
    brandAccentHex: parseConfigString(brandAccentHex, DEFAULT_BRAND_ACCENT_HEX, isValidHexColor),
  };

  return cachedConfig;
}

/**
 * Get a specific config value, loading config if not cached.
 * This is a synchronous version that should only be called after loadConfig() has completed.
 * For server functions, prefer using loadConfig() and destructuring.
 */
export function getConfig(): Config {
  if (!cachedConfig) {
    throw new Error("Config not loaded. Call loadConfig() first in an async context.");
  }
  return cachedConfig;
}

/**
 * Clear cached config (for testing or after settings changes).
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}

/**
 * Sync version of constants for client-side use (no app settings override).
 * This re-exports the default constants for use in client components.
 */
export const clientConfig = {
  guaranteeWindowDays: DEFAULT_GUARANTEE_WINDOW_DAYS,
  guaranteeWarningDay: DEFAULT_GUARANTEE_WARNING_DAY,
  pipelineStallDays: DEFAULT_PIPELINE_STALL_DAYS,
  capacityOverloadThreshold: DEFAULT_CAPACITY_OVERLOAD_THRESHOLD,
  markCollectedConfirmThreshold: DEFAULT_MARK_COLLECTED_CONFIRM_THRESHOLD,
  discordAgentStaleMs: DEFAULT_DISCORD_AGENT_STALE_MS,
  dashboardActivityLimit: DEFAULT_DASHBOARD_ACTIVITY_LIMIT,
  brandAccentHex: DEFAULT_BRAND_ACCENT_HEX,
} as const;

export type ClientConfig = typeof clientConfig;