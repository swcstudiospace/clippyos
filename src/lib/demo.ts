/** Client-safe demo request types. No secrets. */

export const DEMO_ROLES = ["founder", "producer", "editor", "agency", "other"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export const DEMO_QUERY_KEY = ["demo-requests"] as const;

export function parseDemoEmail(value: unknown): string | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) || raw.length > 200) return null;
  return raw;
}

export function parseDemoName(value: unknown): string | null {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  if (raw.length < 2 || raw.length > 80) return null;
  return raw;
}

export type DemoRequestInput = {
  name: string;
  email: string;
  company: string;
  role: DemoRole | string;
  country: string;
  message: string;
};

export type DemoRequest = DemoRequestInput & {
  id: string;
  createdAt: string;
};
