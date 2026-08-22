import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { PLAN_TYPES, type Client, type PlanType } from "@/lib/entities";
import { DEFAULT_MONTHLY_FEE, DEFAULT_SETUP_FEE, PLAN_LABELS } from "@/lib/labels";
import { parseYouTubeChannelUrl } from "@/lib/youtube";
import { todayIsoDate } from "@/lib/format";
import { analyzeChannel, saveClient } from "@/lib/server/clients";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ClientFormValues = {
  id?: string;
  name: string;
  channelUrl: string;
  channelThumbnail: string;
  channelSummary: string;
  offers: string;
  contentStrategy: string;
  planType: PlanType;
  customPlanLabel: string;
  setupFee: number;
  monthlyFee: number;
  startDate: string;
  notes: string;
};

function emptyValues(): ClientFormValues {
  return {
    name: "",
    channelUrl: "",
    channelThumbnail: "",
    channelSummary: "",
    offers: "",
    contentStrategy: "",
    planType: "TEAM_ONLY",
    customPlanLabel: "",
    setupFee: DEFAULT_SETUP_FEE,
    monthlyFee: DEFAULT_MONTHLY_FEE.TEAM_ONLY,
    startDate: todayIsoDate(),
    notes: "",
  };
}

function fromClient(client: Client): ClientFormValues {
  return {
    id: client.id,
    name: client.name,
    channelUrl: client.channelUrl ?? "",
    channelThumbnail: client.channelThumbnail ?? "",
    channelSummary: client.channelSummary ?? "",
    offers: client.offers ?? "",
    contentStrategy: client.contentStrategy ?? "",
    planType: client.planType,
    customPlanLabel: client.customPlanLabel ?? "",
    setupFee: Number(client.setupFee) || DEFAULT_SETUP_FEE,
    monthlyFee: Number(client.monthlyFee) || DEFAULT_MONTHLY_FEE[client.planType],
    startDate: client.startDate ?? todayIsoDate(),
    notes: client.notes ?? "",
  };
}

const ANALYZE_STEPS = [
  "Analyzing channel…",
  "Fetching latest videos…",
  "Generating strategy…",
];

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  aiReady,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  aiReady: boolean;
  onSaved: (id: string) => void;
}) {
  const isEdit = Boolean(client);
  const [step, setStep] = useState<"url" | "analyze" | "review">(
    client ? "review" : "url",
  );
  const [values, setValues] = useState<ClientFormValues>(emptyValues);
  const [baseline, setBaseline] = useState<ClientFormValues>(emptyValues);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [analyzeHint, setAnalyzeHint] = useState(ANALYZE_STEPS[0]);
  const [skipAi, setSkipAi] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = client ? fromClient(client) : emptyValues();
    setValues(next);
    setBaseline(next);
    setStep(client ? "review" : "url");
    setUrlError(null);
    setFormError(null);
    setBusy(false);
    setSkipAi(false);
  }, [open, client]);

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  function patch(partial: Partial<ClientFormValues>) {
    setValues((current) => {
      const next = { ...current, ...partial };
      if (partial.planType && partial.planType !== current.planType) {
        next.monthlyFee = DEFAULT_MONTHLY_FEE[partial.planType];
        if (partial.planType !== "CUSTOM") next.customPlanLabel = "";
      }
      return next;
    });
  }

  function requestClose() {
    if (busy) return;
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    onOpenChange(false);
  }

  async function onAnalyze(event: FormEvent) {
    event.preventDefault();
    const parsed = parseYouTubeChannelUrl(values.channelUrl);
    if (!parsed.ok) {
      setUrlError(parsed.error);
      return;
    }
    setUrlError(null);
    patch({ channelUrl: parsed.canonical });
    if (!aiReady) {
      setSkipAi(true);
      setStep("review");
      if (!values.name) {
        patch({
          channelUrl: parsed.canonical,
          name:
            parsed.kind === "handle"
              ? parsed.value.slice(1)
              : parsed.value,
        });
      }
      return;
    }
    setStep("analyze");
    setBusy(true);
    let tick = 0;
    const timer = window.setInterval(() => {
      tick = (tick + 1) % ANALYZE_STEPS.length;
      setAnalyzeHint(ANALYZE_STEPS[tick]);
    }, 1600);
    try {
      const result = await analyzeChannel({ data: parsed.canonical });
      patch({
        name: result.name || values.name,
        channelUrl: result.channelUrl,
        channelThumbnail: result.channelThumbnail ?? "",
        channelSummary: result.channelSummary,
        offers: result.offers,
        contentStrategy: result.contentStrategy,
      });
      setStep("review");
    } catch (error) {
      captureClientError(error, { source: "analyze-channel" });
      const message =
        error instanceof Error && error.message === "AI_RATE_LIMIT"
          ? "The analysis service is busy. Retry in a moment."
          : error instanceof Error && error.message === "AI_UNAVAILABLE"
            ? "Analysis isn’t available right now. You can still add the client by hand."
            : userFacingErrorMessage(error);
      toast.error(message);
      setSkipAi(true);
      setStep("review");
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!values.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (values.planType === "CUSTOM") {
      if (!values.customPlanLabel.trim()) {
        setFormError("Add a custom plan label.");
        return;
      }
      if (values.monthlyFee % 1000 !== 0 || values.monthlyFee < 0 || values.monthlyFee > 20000) {
        setFormError("Custom monthly fee must be a multiple of 1,000 between 0 and 20,000.");
        return;
      }
    }
    setBusy(true);
    try {
      const result = await saveClient({
        data: {
          id: values.id,
          name: values.name.trim(),
          channelUrl: values.channelUrl.trim() || null,
          channelThumbnail: values.channelThumbnail.trim() || null,
          channelSummary: values.channelSummary || null,
          offers: values.offers || null,
          contentStrategy: values.contentStrategy || null,
          planType: values.planType,
          customPlanLabel: values.customPlanLabel.trim() || null,
          setupFee: values.setupFee,
          monthlyFee: values.monthlyFee,
          startDate: values.startDate || todayIsoDate(),
          notes: values.notes || null,
        },
      });
      toast.success(isEdit ? "Client updated" : "Client added");
      setBaseline(values);
      onSaved(result.id);
      onOpenChange(false);
    } catch (error) {
      captureClientError(error, { source: "save-client" });
      setFormError(userFacingErrorMessage(error));
      toast.error(userFacingErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <DialogContent className="flex max-h-[min(90dvh,44rem)] w-[min(100%-2rem,42rem)] flex-col overflow-hidden">
        <DialogTitle>{isEdit ? "Edit Client" : "Add Client"}</DialogTitle>
        <DialogDescription>
          {step === "url"
            ? "Paste a YouTube channel URL to start."
            : step === "analyze"
              ? "We’re reading the channel and drafting a strategy. Review everything before saving."
              : "Review and edit every field, then save."}
        </DialogDescription>

        {step === "url" ? (
          <form onSubmit={(event) => void onAnalyze(event)} className="mt-4 flex flex-col gap-3">
            <Label htmlFor="channel-url">YouTube channel URL</Label>
            <Input
              id="channel-url"
              value={values.channelUrl}
              onChange={(event) => {
                patch({ channelUrl: event.target.value });
                setUrlError(null);
              }}
              placeholder="https://www.youtube.com/@handle"
              autoComplete="off"
              required
            />
            {urlError ? (
              <p className="text-caption text-danger" role="alert">
                {urlError}
              </p>
            ) : null}
            {!aiReady ? <AIFallbackPanel /> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                {aiReady ? "Analyze channel" : "Continue without analysis"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSkipAi(true);
                  setStep("review");
                }}
              >
                Enter details manually
              </Button>
            </div>
          </form>
        ) : null}

        {step === "analyze" ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-10 text-center">
            <span className="coming-soon-pulse size-2 rounded-full bg-accent" aria-hidden="true" />
            <p className="text-body">{analyzeHint}</p>
          </div>
        ) : null}

        {step === "review" ? (
          <form
            onSubmit={(event) => void onSave(event)}
            className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1"
          >
            {skipAi && !aiReady ? <AIFallbackPanel /> : null}
            <Field label="Name" htmlFor="client-name">
              <Input
                id="client-name"
                value={values.name}
                onChange={(event) => patch({ name: event.target.value })}
                required
              />
            </Field>
            <Field label="Channel URL" htmlFor="client-url">
              <Input
                id="client-url"
                value={values.channelUrl}
                onChange={(event) => patch({ channelUrl: event.target.value })}
              />
            </Field>
            <Field label="Thumbnail URL" htmlFor="client-thumb">
              <Input
                id="client-thumb"
                value={values.channelThumbnail}
                onChange={(event) => patch({ channelThumbnail: event.target.value })}
              />
            </Field>
            <Field label="Channel summary" htmlFor="client-summary">
              <Textarea
                id="client-summary"
                value={values.channelSummary}
                onChange={(event) => patch({ channelSummary: event.target.value })}
              />
            </Field>
            <Field label="Offers" htmlFor="client-offers">
              <Textarea
                id="client-offers"
                value={values.offers}
                onChange={(event) => patch({ offers: event.target.value })}
              />
            </Field>
            <Field label="Content strategy" htmlFor="client-strategy">
              <Textarea
                id="client-strategy"
                className="min-h-36"
                value={values.contentStrategy}
                onChange={(event) => patch({ contentStrategy: event.target.value })}
              />
            </Field>

            <fieldset>
              <legend className="text-caption font-medium">Plan</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {PLAN_TYPES.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    className={cn(
                      "min-h-11 rounded-control border border-border px-3 text-caption font-medium",
                      values.planType === plan
                        ? "bg-accent text-accent-fg"
                        : "bg-secondary-surface text-fg",
                    )}
                    aria-pressed={values.planType === plan}
                    onClick={() => patch({ planType: plan })}
                  >
                    {PLAN_LABELS[plan]}
                  </button>
                ))}
              </div>
            </fieldset>

            {values.planType === "CUSTOM" ? (
              <>
                <Field label="Custom plan label" htmlFor="plan-label">
                  <Input
                    id="plan-label"
                    maxLength={120}
                    value={values.customPlanLabel}
                    onChange={(event) => patch({ customPlanLabel: event.target.value })}
                    placeholder="$3,000 — ideation and channel management"
                  />
                </Field>
                <Field label="Monthly fee" htmlFor="monthly-fee">
                  <Input
                    id="monthly-fee"
                    type="number"
                    min={0}
                    max={20000}
                    step={1000}
                    value={values.monthlyFee}
                    onChange={(event) =>
                      patch({ monthlyFee: Number(event.target.value) || 0 })
                    }
                  />
                </Field>
              </>
            ) : (
              <Field label="Monthly fee" htmlFor="monthly-fee">
                <Input
                  id="monthly-fee"
                  type="number"
                  min={0}
                  step={100}
                  value={values.monthlyFee}
                  onChange={(event) =>
                    patch({ monthlyFee: Number(event.target.value) || 0 })
                  }
                />
              </Field>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Setup fee" htmlFor="setup-fee">
                <Input
                  id="setup-fee"
                  type="number"
                  min={0}
                  value={values.setupFee}
                  onChange={(event) =>
                    patch({ setupFee: Number(event.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Start date" htmlFor="start-date">
                <Input
                  id="start-date"
                  type="date"
                  value={values.startDate}
                  onChange={(event) => patch({ startDate: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Notes" htmlFor="client-notes">
              <Textarea
                id="client-notes"
                value={values.notes}
                onChange={(event) => patch({ notes: event.target.value })}
              />
            </Field>
            {formError ? (
              <p className="text-caption text-danger" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="sticky bottom-0 flex gap-2 bg-elevated/80 py-3 backdrop-blur-md">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : isEdit ? "Save changes" : "Save client"}
              </Button>
              <Button type="button" variant="ghost" onClick={requestClose} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
