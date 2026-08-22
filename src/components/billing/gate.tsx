import { Link } from "@tanstack/react-router";
import { CreditCard, Lock } from "lucide-react";
import type { BillingSnapshot } from "@/lib/billing";
import { billingStatusLabel, billingStatusTone } from "@/lib/billing";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/magicui/shine-border";
import { ClippyMark } from "@/components/brand/clippy-mark";

export function BillingGate({ snapshot }: { snapshot: BillingSnapshot }) {
  const owner = snapshot.role === "owner";
  const pastDue = snapshot.subscription.status === "past_due" || snapshot.subscription.status === "unpaid";

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col justify-center">
      <GlassCard className="relative overflow-hidden">
        <ShineBorder />
        <div className="relative z-[1] flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ClippyMark size={40} />
            <div>
              <h1 className="text-section font-semibold tracking-tight">
                {pastDue ? "Update billing to continue" : "Subscribe to ClippyOS"}
              </h1>
              <p className="text-caption text-muted">
                ClippyOS subscription — not client revenue on the Money tab.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-muted" aria-hidden="true" />
            <Badge tone={billingStatusTone(snapshot.subscription.status)}>
              {billingStatusLabel(snapshot.subscription.status)}
            </Badge>
          </div>
          <p className="text-body text-muted">
            {owner
              ? pastDue
                ? "The last invoice didn’t clear. Open Billing to pay or update the payment method via Airwallex Hosted Checkout."
                : "Choose a plan on Billing. Checkout is hosted by Airwallex — cards, Apple Pay, and Google Pay. ClippyOS never sees card numbers."
              : "This workspace doesn’t have an active ClippyOS subscription yet. Ask an Owner to subscribe from Billing."}
          </p>
          {owner ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/billing">
                  <CreditCard className="size-4" />
                  Open Billing
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/settings">Settings</Link>
              </Button>
            </div>
          ) : (
            <p className="text-caption text-muted">
              Members can sign in, but product tabs stay locked until an Owner completes checkout.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
