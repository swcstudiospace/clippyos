import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  BILLING_QUERY_KEY,
  billingStatusLabel,
  billingStatusTone,
  type SaasPlanKey,
} from "@/lib/billing";
import {
  cancelWorkspaceSubscription,
  getBillingSnapshot,
  refreshBillingEntitlement,
  startBillingCheckout,
} from "@/lib/server/billing-fns";
import { WhopCheckoutEmbed } from "@/components/billing/whop-embed";
import { formatDate, formatUsd } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ShineBorder } from "@/components/magicui/shine-border";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/billing")({
  component: BillingPage,
});

function BillingPage() {
  const queryClient = useQueryClient();
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const query = useQuery({
    queryKey: BILLING_QUERY_KEY,
    queryFn: () => getBillingSnapshot(),
  });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<{
    sessionId: string;
    hostedUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (!search.includes("checkout=success")) return;
    void refreshBillingEntitlement()
      .then(async () => {
        toast.success("Subscription updated");
        await queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
      })
      .catch(() => undefined);
  }, [search, queryClient]);

  const checkout = useMutation({
    mutationFn: (planKey: SaasPlanKey) => startBillingCheckout({ data: { planKey } }),
    onSuccess: (result) => {
      setCheckoutSession(result);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const cancel = useMutation({
    mutationFn: () => cancelWorkspaceSubscription(),
    onSuccess: async () => {
      setCancelOpen(false);
      toast.success("Cancels at period end");
      await queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Billing" description="ClippyOS subscription" />
        <Skeleton className="mt-6 h-40 w-full rounded-card" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Billing" description="ClippyOS subscription" />
        <ErrorState
          className="mt-6"
          title="Couldn’t load billing"
          description="Try again. Keys stay on the server."
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const snapshot = query.data;
  const owner = snapshot.role === "owner";
  const sub = snapshot.subscription;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Billing"
        description="ClippyOS subscription — not client invoices. Those stay on Money."
      />

      <GlassCard className="relative mt-6 overflow-hidden">
        <ShineBorder />
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption text-muted">Current plan</p>
            <h2 className="text-section font-semibold tracking-tight">
              {snapshot.plans.find((plan) => plan.key === sub.planKey)?.name ?? "None"}
            </h2>
            <p className="mt-1 text-caption text-muted">
              {sub.currentPeriodEnd
                ? `Renews ${formatDate(sub.currentPeriodEnd)}`
                : "No renewal date yet"}
              {sub.cancelAtPeriodEnd ? " · cancels at period end" : ""}
            </p>
          </div>
          <Badge tone={billingStatusTone(sub.status)}>{billingStatusLabel(sub.status)}</Badge>
        </div>
        <dl className="relative z-[1] mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-caption text-muted">SaaS MRR</dt>
            <dd className="text-body">{sub.mrr != null ? formatUsd(sub.mrr) : "—"}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Seats</dt>
            <dd className="text-body">
              {snapshot.seatsUsed}
              {snapshot.seatLimit != null ? ` / ${snapshot.seatLimit}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Last invoice</dt>
            <dd className="text-body">{sub.lastInvoiceStatus ?? "—"}</dd>
          </div>
        </dl>
        {owner && snapshot.subscription.status !== "none" && !sub.cancelAtPeriodEnd ? (
          <div className="relative z-[1] mt-4">
            <Button size="sm" variant="ghost" onClick={() => setCancelOpen(true)}>
              Cancel at period end
            </Button>
          </div>
        ) : null}
        {owner && snapshot.whop.communityUrl ? (
          <div className="relative z-[1] mt-2">
            <Button size="sm" variant="ghost" asChild>
              <a href={snapshot.whop.communityUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open community
              </a>
            </Button>
          </div>
        ) : null}
      </GlassCard>

      <h2 className="mt-8 text-card font-semibold tracking-tight">Plans</h2>
      <p className="mt-1 text-caption text-muted">
        Subscribe via Whop Checkout — cards, wallets, and local payment methods. Plan IDs
        come from Settings → Integrations.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {snapshot.plans.map((plan) => {
          const current = sub.planKey === plan.key && snapshot.entitled;
          return (
            <GlassCard key={plan.key}>
              <p className="text-caption text-muted">{plan.displayPrice}/mo</p>
              <h3 className="text-card font-semibold tracking-tight">{plan.name}</h3>
              <p className="mt-2 text-caption text-muted">{plan.blurb}</p>
              <p className="mt-2 text-caption text-muted">{plan.seats} seats</p>
              {owner ? (
                <Button
                  className="mt-4 w-full"
                  variant={current ? "secondary" : "primary"}
                  disabled={checkout.isPending || !plan.priceId}
                  onClick={() => checkout.mutate(plan.key)}
                >
                  <CreditCard className="size-4" />
                  {checkout.isPending
                    ? "Opening checkout…"
                    : current
                      ? "Manage / update"
                      : plan.priceId
                        ? "Subscribe"
                        : "Add price ID"}
                </Button>
              ) : (
                <p className="mt-4 text-caption text-muted">Only Owners can change the plan.</p>
              )}
            </GlassCard>
          );
        })}
      </div>

      {!snapshot.whop.configured ? (
        <p className="mt-4 text-caption text-muted">
          Connect Whop in Settings → Integrations before checkout. Until a plan ID is
          saved, the rest of the product stays open so you can finish setup.
        </p>
      ) : null}

      <h2 className="mt-8 text-card font-semibold tracking-tight">Invoices</h2>
      {snapshot.invoices.length === 0 ? (
        <p className="mt-2 text-caption text-muted">No invoices yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {snapshot.invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2"
            >
              <div>
                <p className="text-body font-medium">
                  {formatUsd(invoice.amount)} {invoice.currency}
                </p>
                <p className="text-caption text-muted">
                  {invoice.paidAt ? formatDate(invoice.paidAt) : formatDate(invoice.createdAt)} ·{" "}
                  {invoice.status}
                </p>
              </div>
              {invoice.hostedUrl ? (
                <Button size="sm" variant="ghost" asChild>
                  <a href={invoice.hostedUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" />
                    View
                  </a>
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogTitle>Cancel at period end?</DialogTitle>
          <DialogDescription>
            You’ll keep access until the current period ends. No refund is issued from this
            screen.
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Confirm cancel
            </Button>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={checkoutSession !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCheckoutSession(null);
            void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogTitle>Whop Checkout</DialogTitle>
          <DialogDescription>
            Embedded Whop checkout. Access unlocks right after payment — no card data ever
            reaches ClippyOS.
          </DialogDescription>
          {checkoutSession ? (
            <>
              <div className="mt-3 min-h-[420px]">
                <WhopCheckoutEmbed
                  sessionId={checkoutSession.sessionId}
                  returnUrl={`${window.location.origin}/billing?checkout=success`}
                />
              </div>
              {checkoutSession.hostedUrl ? (
                <p className="mt-2 text-caption text-muted">
                  Trouble loading the embed?{" "}
                  <a
                    className="underline"
                    href={checkoutSession.hostedUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open the hosted checkout page
                  </a>{" "}
                  instead.
                </p>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
