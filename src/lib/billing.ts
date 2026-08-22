/** Client-safe SaaS billing types. Secrets never live here. */

export const BILLING_QUERY_KEY = ["billing"] as const;
export const PRODUCT_ONBOARDING_QUERY_KEY = ["product-onboarding"] as const;

export const SAAS_PLAN_KEYS = ["starter", "pro", "agency"] as const;
export type SaasPlanKey = (typeof SAAS_PLAN_KEYS)[number];

export const BILLING_STATUSES = [
  "none",
  "in_trial",
  "active",
  "past_due",
  "unpaid",
  "canceled",
] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];

export const ENTITLED_STATUSES: readonly BillingStatus[] = ["active", "in_trial"];

export type WorkspaceRole = "owner" | "member";

export type SaasPlan = {
  key: SaasPlanKey;
  name: string;
  blurb: string;
  displayPrice: string;
  interval: "month" | "year";
  seats: number;
  priceId: string | null;
};

export const DEFAULT_SAAS_PLANS: Record<
  SaasPlanKey,
  Omit<SaasPlan, "priceId">
> = {
  starter: {
    key: "starter",
    name: "Starter",
    blurb: "Solo operator. Pipeline, Money, and core OS.",
    displayPrice: "$99",
    interval: "month",
    seats: 3,
  },
  pro: {
    key: "pro",
    name: "Pro",
    blurb: "Team seats, Social Machine, and Agent runs.",
    displayPrice: "$249",
    interval: "month",
    seats: 10,
  },
  agency: {
    key: "agency",
    name: "Agency",
    blurb: "Full clipping agency OS for larger rosters.",
    displayPrice: "$499",
    interval: "month",
    seats: 25,
  },
};

export type BillingInvoice = {
  id: string;
  externalId: string;
  amount: number;
  currency: string;
  status: string;
  hostedUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type WorkspaceSubscription = {
  status: BillingStatus;
  planKey: SaasPlanKey | null;
  priceId: string | null;
  externalCustomerId: string | null;
  externalSubscriptionId: string | null;
  externalCheckoutId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  lastInvoiceStatus: string | null;
  lastInvoiceAt: string | null;
  mrr: number | null;
  updatedAt: string | null;
};

export type AirwallexPublicConfig = {
  configured: boolean;
  env: "sandbox" | "live";
  hasWebhookSecret: boolean;
  legalEntitySet: boolean;
  paymentAccountSet: boolean;
  last4: string | null;
};

export type BillingSnapshot = {
  role: WorkspaceRole;
  enforced: boolean;
  entitled: boolean;
  subscription: WorkspaceSubscription;
  plans: SaasPlan[];
  invoices: BillingInvoice[];
  seatsUsed: number;
  seatLimit: number | null;
  airwallex: AirwallexPublicConfig;
  returnCheckout: "success" | "back" | null;
};

export function isEntitled(status: BillingStatus): boolean {
  return (ENTITLED_STATUSES as readonly string[]).includes(status);
}

export function billingStatusTone(
  status: BillingStatus,
): "green" | "orange" | "red" | "neutral" {
  switch (status) {
    case "active":
    case "in_trial":
      return "green";
    case "past_due":
    case "unpaid":
      return "orange";
    case "canceled":
      return "red";
    default:
      return "neutral";
  }
}

export function billingStatusLabel(status: BillingStatus): string {
  switch (status) {
    case "in_trial":
      return "Trial";
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "unpaid":
      return "Unpaid";
    case "canceled":
      return "Canceled";
    default:
      return "None";
  }
}

export const CLIENT_ONBOARDING_STEPS = [
  "plan",
  "agreement",
  "access",
  "discord",
  "footage",
  "thirty_day",
  "money",
  "team",
  "kickoff",
] as const;
export type ClientOnboardingStep = (typeof CLIENT_ONBOARDING_STEPS)[number];

export const CLIENT_ONBOARDING_COPY: Record<
  ClientOnboardingStep,
  { title: string; body: string }
> = {
  plan: {
    title: "Confirm the plan",
    body: "Agree Team only, Personal involved, or custom retainer. Record the start date — Day 1 of the 30-day guarantee.",
  },
  agreement: {
    title: "Send the client agreement",
    body: "Download the workspace agreement and send it for signature before production starts.",
  },
  access: {
    title: "Collect access",
    body: "YouTube Studio, footage Drive, thumbnail references, and the Google account email on the client record.",
  },
  discord: {
    title: "Discord",
    body: "Invite the founder, create a client channel, store the server id if you use the Discord bridge.",
  },
  footage: {
    title: "Footage expectations",
    body: "Long-form is 4 minutes or longer. Missing footage parks the lane on Waiting for footage.",
  },
  thirty_day: {
    title: "First 30 days",
    body: "Setup-fee refund if views do not increase in 30 days. Track Day n/30 on the Dashboard.",
  },
  money: {
    title: "Money setup",
    body: "Create the setup invoice and first monthly invoice. Distinct from ClippyOS’s own subscription.",
  },
  team: {
    title: "Staff the lane",
    body: "Assign channel manager, editors, and thumbnail designer. Flag anyone on more than three active clients.",
  },
  kickoff: {
    title: "Kick off production",
    body: "Set the stage to Waiting for footage and start Ideation / Thumbnails against this client.",
  },
};

export type ClientOnboardingChecklist = {
  steps: Record<ClientOnboardingStep, { done: boolean; at: string | null }>;
};

export function emptyClientChecklist(): ClientOnboardingChecklist {
  return {
    steps: Object.fromEntries(
      CLIENT_ONBOARDING_STEPS.map((step) => [step, { done: false, at: null }]),
    ) as ClientOnboardingChecklist["steps"],
  };
}

export function parseClientChecklist(raw: unknown): ClientOnboardingChecklist {
  const empty = emptyClientChecklist();
  if (!raw || typeof raw !== "object") return empty;
  const source = raw as { steps?: Record<string, { done?: unknown; at?: unknown }> };
  for (const step of CLIENT_ONBOARDING_STEPS) {
    const rec = source.steps?.[step];
    empty.steps[step] = {
      done: rec?.done === true,
      at: typeof rec?.at === "string" ? rec.at : null,
    };
  }
  return empty;
}

export const PRODUCT_ONBOARDING_STEPS = [
  "invite",
  "airwallex",
  "daytona",
  "first_client",
  "approvals",
  "social_start",
] as const;
export type ProductOnboardingStep = (typeof PRODUCT_ONBOARDING_STEPS)[number];

export const PRODUCT_ONBOARDING_COPY: Record<
  ProductOnboardingStep,
  { title: string; body: string; href: string }
> = {
  invite: {
    title: "Invite your team",
    body: "Owners add Members in Settings → Team access. One person, one workspace.",
    href: "/settings#team",
  },
  airwallex: {
    title: "Confirm Airwallex",
    body: "Keys stay in Settings → Integrations. Test Connection never opens checkout.",
    href: "/settings#integrations",
  },
  daytona: {
    title: "Connect Daytona (optional)",
    body: "Needed for the Social Machine. The VM stays off until you press Start.",
    href: "/settings#integrations",
  },
  first_client: {
    title: "Add your first client",
    body: "Create a roster row, paste a YouTube URL, and run the onboarding checklist.",
    href: "/clients",
  },
  approvals: {
    title: "Turn on require approval before first client publish",
    body: "Live publishes wait in Approvals until an Owner or Admin signs off. Drafts never wait.",
    href: "/settings#approvals",
  },
  social_start: {
    title: "Start Social when you are ready",
    body: "Log into Instagram, X, TikTok, or YouTube Studio inside the sandbox browser — never in ClippyOS. Connect YouTube Publish in Settings to upload via API.",
    href: "/social",
  },
};

export type ProductOnboardingState = {
  dismissed: boolean;
  steps: Record<ProductOnboardingStep, { done: boolean; at: string | null }>;
};

export function emptyProductOnboarding(): ProductOnboardingState {
  return {
    dismissed: false,
    steps: Object.fromEntries(
      PRODUCT_ONBOARDING_STEPS.map((step) => [step, { done: false, at: null }]),
    ) as ProductOnboardingState["steps"],
  };
}
