export function formatUsd(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatPercent(
  value: number | null | undefined,
  digits = 0,
): string {
  if (value == null || !Number.isFinite(value)) return "0%";
  return `${value.toFixed(digits)}%`;
}

export function formatCompactCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    const n = abs / 1_000_000_000;
    return `${sign}${n >= 10 ? n.toFixed(0) : n.toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    const n = abs / 1_000_000;
    return `${sign}${n >= 10 ? n.toFixed(0) : n.toFixed(1)}M`;
  }
  if (abs >= 1000) {
    const n = abs / 1000;
    return `${sign}${n >= 10 ? n.toFixed(0) : n.toFixed(1)}K`;
  }
  return `${sign}${new Intl.NumberFormat("en-US").format(Math.round(abs))}`;
}

export function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}$${Number.isInteger(m) || abs >= 10_000_000 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}$${Number.isInteger(k) || abs >= 10_000 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${sign}$${Math.round(abs)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(sec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(sec), "second");
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(min, "minute");
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(hr, "hour");
  const day = Math.round(hr / 24);
  if (Math.abs(day) < 14) return rtf.format(day, "day");
  return formatDate(value);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addMonthsIso(isoDate: string, months: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
