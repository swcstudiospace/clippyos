import { useMemo, useState } from "react";
import { BookOpen, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_PLAYBOOK_POLICIES,
  HERMES_PLAYBOOKS,
  formatPlaybookPackage,
  type PlaybookPolicies,
  type PlaybookRisk,
} from "@/lib/playbooks";
import { PLAYBOOK_PACKAGE_VERSION } from "@/lib/connect";
import { SCOPE_LABELS } from "@/lib/autonomy";
import { copyTextToClipboard } from "@/lib/clipboard";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function riskTone(risk: PlaybookRisk) {
  if (risk === "high") return "red" as const;
  if (risk === "medium") return "orange" as const;
  return "green" as const;
}

export function PlaybookCatalog({
  policies,
  enabled,
}: {
  policies?: PlaybookPolicies | null;
  enabled: boolean;
}) {
  const safe = policies ?? DEFAULT_PLAYBOOK_POLICIES;
  const [openId, setOpenId] = useState<string | null>(null);
  const brief = useMemo(
    () =>
      formatPlaybookPackage({
        policies: safe,
        enabled,
        origin: typeof window === "undefined" ? "{origin}" : window.location.origin,
        version: PLAYBOOK_PACKAGE_VERSION,
      }),
    [safe, enabled],
  );

  async function copyBrief() {
    const ok = await copyTextToClipboard(brief);
    toast[ok ? "success" : "error"](
      ok ? "Playbook package copied — paste into Hermes" : "Couldn’t copy — select the text instead",
    );
  }

  return (
    <GlassCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">Hermes Playbook</h3>
            <p className="text-caption text-muted">
              Official autonomous workflows. Playbooks run inside Hermes; Agency Admin provides the
              tools and audit trail.
            </p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void copyBrief()}>
          <Copy className="size-4" aria-hidden="true" />
          Copy Playbook package for Hermes
        </Button>
      </div>
      <Badge tone="teal" className="mt-3">
        Playbooks run inside Hermes; Agency Admin provides the tools and audit trail.
      </Badge>
      <ul className="mt-4 flex flex-col gap-2">
        {HERMES_PLAYBOOKS.map((playbook) => {
          const open = openId === playbook.id;
          return (
            <li key={playbook.id} className="rounded-control bg-secondary-surface/50">
              <button
                type="button"
                className="flex w-full flex-col gap-2 px-3 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : playbook.id)}
              >
                <div className="min-w-0">
                  <p className="font-medium">{playbook.name}</p>
                  <p className="text-caption text-muted">{playbook.summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {playbook.id.startsWith("reactor_") ? <Badge tone="teal">reactor</Badge> : null}
                  <Badge tone="blue">{playbook.trigger}</Badge>
                  <Badge tone={riskTone(playbook.risk)}>{playbook.risk}</Badge>
                </div>
              </button>
              {open ? (
                <div className="border-t border-border px-3 py-3 text-caption">
                  <p className="text-muted">{playbook.triggerDetail}</p>
                  <p className="mt-2 font-medium">Steps</p>
                  <ol className="mt-1 list-decimal pl-4">
                    {playbook.steps.map((step) => (
                      <li key={step} className="text-muted">
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 font-medium">Tools</p>
                  <p className="text-muted">{playbook.tools.join(", ")}</p>
                  <p className="mt-2 font-medium">Scopes</p>
                  <p className="text-muted">
                    {playbook.requiredScopes.map((scope) => SCOPE_LABELS[scope]).join(", ")}
                  </p>
                  <p className="mt-2 font-medium">Integrations</p>
                  <p className="text-muted">{playbook.requiredIntegrations.join(", ") || "None"}</p>
                  <p className="mt-2 font-medium">Success</p>
                  <p className="text-muted">{playbook.success}</p>
                  <p className="mt-2 font-medium">Guardrail</p>
                  <p className="text-muted">{playbook.guardrail}</p>
                  <p className="mt-2 font-medium">Human-stop</p>
                  <p className="text-muted">{playbook.humanStop}</p>
                  <p className="mt-2 font-medium">Escalation</p>
                  <p className="text-muted">{playbook.escalation}</p>
                  <p className="mt-2 font-medium">Expected audit events</p>
                  <p className="text-muted">{playbook.auditEvents.join(", ")}</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-caption text-muted">
        Pass <code>X-Playbook-Id</code> and <code>X-Run-Id</code> (or payload playbook / runId) so
        every tool call is attributable in the audit log.
      </p>
    </GlassCard>
  );
}
