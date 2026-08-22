import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Client } from "@/lib/entities";
import { todayIsoDate } from "@/lib/format";
import { ANALYTICS_QUERY_KEY } from "@/lib/analytics";
import { saveManualSnapshot } from "@/lib/server/analytics";
import { userFacingErrorMessage } from "@/lib/errors";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

function num(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function ManualEntryForm({
  clients,
  selectedClientId,
}: {
  clients: Client[];
  selectedClientId: string | null;
}) {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState(selectedClientId ?? clients[0]?.id ?? "");
  const [date, setDate] = useState(todayIsoDate());
  const [views, setViews] = useState("");
  const [subscribers, setSubscribers] = useState("");
  const [watchHours, setWatchHours] = useState("");
  const [ctr, setCtr] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const save = useMutation({
    mutationFn: (force: boolean) =>
      saveManualSnapshot({
        data: {
          clientId,
          date,
          views: num(views),
          subscribers: num(subscribers),
          watchHours: num(watchHours),
          impressionsCtr: num(ctr),
          overwrite: force,
        },
      }),
    onSuccess: async () => {
      toast.success("Snapshot saved");
      setOverwrite(false);
      setConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "SNAPSHOT_EXISTS") {
        setConfirm(true);
        return;
      }
      toast.error(userFacingErrorMessage(error));
    },
  });

  const active = clients.filter((row) => row.status === "ACTIVE" && !row.deletedAt);

  return (
    <GlassCard>
      <h3 className="text-card font-semibold tracking-tight">Enter data manually</h3>
      <p className="mt-1 text-caption text-muted">
        Always available. Use this for watch hours and CTR, or when the YouTube key is missing.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!clientId) return;
          save.mutate(overwrite);
        }}
      >
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="manual-client">Client</Label>
          <select
            id="manual-client"
            className="min-h-11 w-full rounded-button border border-border bg-elevated px-3 text-body"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
          >
            <option value="">Select a client</option>
            {active.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-date">Date</Label>
          <Input id="manual-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-subs">Subscribers</Label>
          <Input id="manual-subs" inputMode="numeric" value={subscribers} onChange={(e) => setSubscribers(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-views">Views</Label>
          <Input id="manual-views" inputMode="numeric" value={views} onChange={(e) => setViews(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-watch">Watch hours</Label>
          <Input id="manual-watch" inputMode="decimal" value={watchHours} onChange={(e) => setWatchHours(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-ctr">Average CTR (%)</Label>
          <Input id="manual-ctr" inputMode="decimal" value={ctr} onChange={(e) => setCtr(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={save.isPending || !clientId}>
            {save.isPending ? "Saving…" : "Save snapshot"}
          </Button>
        </div>
      </form>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>Overwrite this date?</DialogTitle>
          <DialogDescription>
            A snapshot already exists for this client on {date}. Saving replaces that day’s numbers.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOverwrite(true);
                save.mutate(true);
              }}
            >
              Overwrite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
