export const APP_NAME = "ClippyOS";
export const APP_TAGLINE = "Autonomous Operating System for Clipping";
export const THEME_STORAGE_KEY = "clippy-os-theme";
export const SIDEBAR_STORAGE_KEY = "clippy-os-sidebar-collapsed";
export const IDEATION_PANEL_STORAGE_KEY = "clippy-os-ideation-panel";
export const THUMBNAILS_PANEL_STORAGE_KEY = "clippy-os-thumbnails-panel";
export const THUMBNAILS_CLIENT_STORAGE_KEY = "clippy-os-thumbnails-client";
export const OBJECTIVES_DISMISS_KEY = "clippy-os-objectives-dismissed";
export const OBJECTIVES_TODOS_KEY = "clippy-os-objectives-todos";
export const DASHBOARD_ALERTS_SESSION_KEY = "clippy-os-dashboard-alerts-session";
export const SOCIAL_DESKTOP_SIZE_KEY = "clippy-os-social-desktop-size";
export const MASKED_SECRET = "••••••";
export const CAPACITY_OVERLOAD_THRESHOLD = 3;
export const GUARANTEE_WINDOW_DAYS = 30;
export const GUARANTEE_WARNING_DAY = 25;
export const MARK_COLLECTED_CONFIRM_THRESHOLD = 5000;
/** Discord Status Agent runs ~every 30 minutes; treat last-run older than this as stale. */
export const DISCORD_AGENT_STALE_MS = 90 * 60 * 1000;
export const DASHBOARD_ACTIVITY_LIMIT = 8;
/** Pipeline stall: ACTIVE clients whose latest stage is not PUBLISHED and is this many days old. */
export const PIPELINE_STALL_DAYS = 7;
export const BRAND_ACCENT_HEX = "#10B981";
