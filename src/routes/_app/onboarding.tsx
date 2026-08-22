import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { downloadClientAgreement } from "@/lib/server/onboarding";
import { listClients } from "@/lib/server/clients";
import { decodeBase64, downloadBinaryFile } from "@/lib/clipboard";
import { OnboardingGuide } from "@/components/onboarding/guide";
import { ClientOnboardingChecklistCard } from "@/components/onboarding/client-checklist";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ShineBorder } from "@/components/magicui/shine-border";
import { CoolMode } from "@/components/magicui/cool-mode";
import { toast } from "sonner";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { isActiveClient } from "@/lib/money";

export const Route = createFileRoute("/_app/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(),
  });
  const [clientId, setClientId] = useState<string>("");
  const active = useMemo(
    () => (clientsQuery.data ?? []).filter((row) => isActiveClient(row)),
    [clientsQuery.data],
  );
  const selected = active.find((row) => row.id === clientId) ?? active[0] ?? null;

  const downloadMut = useMutation({
    mutationFn: () => downloadClientAgreement(),
    onSuccess: (file) => {
      const ok = downloadBinaryFile(
        file.filename,
        file.contentType,
        decodeBase64(file.base64),
      );
      if (ok) toast.success("Client agreement downloaded");
      else toast.error("Couldn’t start the download. Try again.");
    },
    onError: (error) => {
      captureClientError(error, { source: "download-agreement" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Onboarding"
        description="How we bring a personal-brand channel onto the roster — agreement, access, footage, and the 30-day guarantee."
      />

      <GlassCard className="relative mt-6 overflow-hidden">
        <ShineBorder />
        <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-card font-semibold tracking-tight">
              Client agreement
            </h2>
            <p className="mt-1 text-body text-muted">
              Trusted workspace document. Download only — never a client-supplied
              link.
            </p>
          </div>
          <CoolMode>
            <Button
              onClick={() => downloadMut.mutate()}
              disabled={downloadMut.isPending}
            >
              <Download className="size-4" aria-hidden="true" />
              {downloadMut.isPending ? "Preparing…" : "Download Client Agreement"}
            </Button>
          </CoolMode>
        </div>
      </GlassCard>

      <div className="mt-4">
        {selected ? (
          <>
            {active.length > 1 ? (
              <label className="mb-3 flex flex-col gap-1.5">
                <span className="text-caption text-muted">Client</span>
                <select
                  className="h-11 rounded-control border border-border bg-surface px-3 text-body"
                  value={selected.id}
                  onChange={(event) => setClientId(event.target.value)}
                >
                  {active.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <ClientOnboardingChecklistCard
              clientId={selected.id}
              checklist={selected.onboardingChecklist}
            />
          </>
        ) : (
          <GlassCard>
            <p className="text-body text-muted">
              Add a client first, then tick the onboarding checklist against that roster row.
            </p>
          </GlassCard>
        )}
      </div>

      <div className="mt-4">
        <OnboardingGuide />
      </div>
    </div>
  );
}
