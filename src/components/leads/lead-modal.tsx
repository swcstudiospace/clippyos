import { useEffect, useState, type FormEvent } from "react";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/entities";
import { LEAD_STATUS_LABELS } from "@/lib/labels";
import { asMoney } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterChip } from "@/components/money/filter-chip";

export type LeadFormValues = {
  id?: string;
  name: string;
  channelUrl: string;
  notes: string;
  status: LeadStatus;
  upfrontCash: number;
  monthlyRecurring: number;
};

function emptyValues(): LeadFormValues {
  return {
    name: "",
    channelUrl: "",
    notes: "",
    status: "TO_CONTACT",
    upfrontCash: 0,
    monthlyRecurring: 0,
  };
}

function fromLead(lead: Lead): LeadFormValues {
  return {
    id: lead.id,
    name: lead.name,
    channelUrl: lead.channelUrl ?? "",
    notes: lead.notes ?? "",
    status: lead.status,
    upfrontCash: asMoney(lead.upfrontCash),
    monthlyRecurring: asMoney(lead.monthlyRecurring),
  };
}

export function LeadModal({
  open,
  onOpenChange,
  lead,
  busy,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  busy: boolean;
  onSave: (values: LeadFormValues) => void;
}) {
  const [values, setValues] = useState<LeadFormValues>(emptyValues());

  useEffect(() => {
    if (!open) return;
    setValues(lead ? fromLead(lead) : emptyValues());
  }, [open, lead]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const name = values.name.trim();
    if (!name) return;
    onSave({
      ...values,
      name,
      channelUrl: values.channelUrl.trim(),
      notes: values.notes.trim(),
      upfrontCash: Math.max(0, Number(values.upfrontCash) || 0),
      monthlyRecurring: Math.max(0, Number(values.monthlyRecurring) || 0),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100%-2rem,32rem)]">
        <DialogTitle>{lead ? "Edit lead" : "Add lead"}</DialogTitle>
        <DialogDescription>
          Pipeline money is live. Closed leads still count toward won cash;
          lost leads do not.
        </DialogDescription>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-name">Name</Label>
            <Input
              id="lead-name"
              required
              maxLength={200}
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Brand or founder"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-channel">Channel URL</Label>
            <Input
              id="lead-channel"
              type="text"
              inputMode="url"
              maxLength={500}
              value={values.channelUrl}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  channelUrl: event.target.value,
                }))
              }
              placeholder="https://youtube.com/@…"
            />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-caption font-medium text-fg">Status</legend>
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => (
                <FilterChip
                  key={status}
                  label={LEAD_STATUS_LABELS[status]}
                  active={values.status === status}
                  onClick={() =>
                    setValues((current) => ({ ...current, status }))
                  }
                />
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-upfront">Upfront cash</Label>
              <Input
                id="lead-upfront"
                type="number"
                min={0}
                step={100}
                value={values.upfrontCash}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    upfrontCash: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-mrr">Monthly recurring</Label>
              <Input
                id="lead-mrr"
                type="number"
                min={0}
                step={100}
                value={values.monthlyRecurring}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    monthlyRecurring: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea
              id="lead-notes"
              maxLength={20000}
              value={values.notes}
              onChange={(event) =>
                setValues((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="How they found us, offer, next step…"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="submit" disabled={busy || !values.name.trim()}>
              {busy ? "Saving…" : lead ? "Save lead" : "Add lead"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
