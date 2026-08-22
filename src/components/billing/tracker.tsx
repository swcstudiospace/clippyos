import { Link } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import {
  billingStatusLabel,
  billingStatusTone,
  DEFAULT_SAAS_PLANS,
  type BillingSnapshot,
} from "@/lib/billing";
import { formatDate, formatUsd } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SubscriptionTracker({ snapshot }: { snapshot: BillingSnapshot }) {
  const plan = snapshot.subscription.planKey
    ? DEFAULT_SAAS_PLANS[snapshot.subscription.planKey]
    : null;
  return (
    <GlassCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption text-muted">ClippyOS subscription</p>
          <h2 className="text-card font-semibold tracking-tight">
            {plan?.name ?? "No plan"}
          </h2>
          <p className="mt-1 text-caption text-muted">
            Separate from client revenue on Money.
          </p>
        </div>
        <Badge tone={billingStatusTone(snapshot.subscription.status)}>
          {billingStatusLabel(snapshot.subscription.status)}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-caption text-muted">Renewal</dt>
          <dd className="text-body">
            {snapshot.subscription.currentPeriodEnd
              ? formatDate(snapshot.subscription.currentPeriodEnd)
              : "—"}
            {snapshot.subscription.cancelAtPeriodEnd ? " · cancels at period end" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">SaaS MRR</dt>
          <dd className="text-body">
            {snapshot.subscription.mrr != null ? formatUsd(snapshot.subscription.mrr) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Seats</dt>
          <dd className="text-body">
            {snapshot.seatsUsed}
            {snapshot.seatLimit != null ? ` / ${snapshot.seatLimit}` : ""}
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <Button size="sm" variant="secondary" asChild>
          <Link to="/billing">
            <CreditCard className="size-3.5" />
            Manage billing
          </Link>
        </Button>
      </div>
    </GlassCard>
  );
}
