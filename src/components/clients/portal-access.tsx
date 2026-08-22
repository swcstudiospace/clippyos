import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, Link2, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge, statusTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PORTAL_ADMIN_KEY, setPortalBearerToken } from "@/lib/portal";
import {
  invitePortalUserFn,
  listPortalUsersFn,
  revokePortalUserFn,
  savePortalWorkingOnFn,
  setPortalCanApproveFn,
  startPortalPreviewFn,
} from "@/lib/server/portal-admin-fns";
import { copyTextToClipboard } from "@/lib/clipboard";
import { formatRelativeTime } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";

export function PortalAccessPanel({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [canApprove, setCanApprove] = useState(true);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [workingOn, setWorkingOn] = useState<string | null>(null);

  const query = useQuery({
    queryKey: [...PORTAL_ADMIN_KEY, clientId],
    queryFn: () => listPortalUsersFn({ data: { clientId } }),
  });

  const users = query.data?.users ?? [];
  const savedNote = query.data?.workingOn ?? "";

  const invite = useMutation({
    mutationFn: () =>
      invitePortalUserFn({
        data: { clientId, email: email.trim(), name: name.trim() || undefined, canApprove },
      }),
    onSuccess: async (data) => {
      setInviteUrl(data.inviteUrl);
      setEmail("");
      setName("");
      toast.success("Invite ready — copy the portal link");
      await queryClient.invalidateQueries({ queryKey: [...PORTAL_ADMIN_KEY, clientId] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokePortalUserFn({ data: { id } }),
    onSuccess: async () => {
      toast.success("Access revoked");
      await queryClient.invalidateQueries({ queryKey: [...PORTAL_ADMIN_KEY, clientId] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const toggleApprove = useMutation({
    mutationFn: (input: { id: string; canApprove: boolean }) => setPortalCanApproveFn({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...PORTAL_ADMIN_KEY, clientId] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const saveNote = useMutation({
    mutationFn: () =>
      savePortalWorkingOnFn({ data: { clientId, note: (workingOn ?? savedNote).trim() || null } }),
    onSuccess: () => toast.success("Client-visible note saved"),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const preview = useMutation({
    mutationFn: () => startPortalPreviewFn({ data: { clientId } }),
    onSuccess: (data) => {
      setPortalBearerToken(data.token);
      window.open("/portal/home", "_blank", "noopener,noreferrer");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function onInvite(event: FormEvent) {
    event.preventDefault();
    invite.mutate();
  }

  const portalLink =
    typeof window !== "undefined" ? `${window.location.origin}/portal/login` : "/portal/login";

  return (
    <GlassCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-card font-semibold tracking-tight">Portal access</h2>
          <p className="mt-1 text-caption text-muted">
            Brand stakeholders land on /portal only. They never see Money, Settings, or other clients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const ok = await copyTextToClipboard(portalLink);
              toast.success(ok ? "Portal link copied" : "Copy the URL from the address bar");
            }}
          >
            <Link2 className="size-4" />
            Copy portal link
          </Button>
          <Button variant="secondary" size="sm" onClick={() => preview.mutate()} disabled={preview.isPending}>
            <Eye className="size-4" />
            View as client
          </Button>
        </div>
      </div>

      <form className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={onInvite}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="portal-invite-email">Invite email</Label>
          <Input
            id="portal-invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="brand@studio.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="portal-invite-name">Name</Label>
          <Input
            id="portal-invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <label className="flex min-h-11 items-center gap-3 text-caption">
          <Switch checked={canApprove} onCheckedChange={setCanApprove} />
          Can approve publishes
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={invite.isPending}>
            <UserPlus className="size-4" />
            {invite.isPending ? "Inviting…" : "Send invite"}
          </Button>
        </div>
      </form>

      {inviteUrl ? (
        <div className="mt-4 flex flex-col gap-2 rounded-control bg-secondary-surface/60 p-3">
          <p className="text-caption text-muted">Magic invite link — they set a password on first open.</p>
          <div className="flex flex-wrap gap-2">
            <code className="min-w-0 flex-1 truncate text-caption">{inviteUrl}</code>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const ok = await copyTextToClipboard(inviteUrl);
                toast.success(ok ? "Invite copied" : inviteUrl);
              }}
            >
              <Copy className="size-4" />
              Copy
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2">
        <Label htmlFor="portal-working-on">What we’re working on</Label>
        <Textarea
          id="portal-working-on"
          value={workingOn ?? savedNote}
          onChange={(e) => setWorkingOn(e.target.value)}
          placeholder="Client-visible one-liner. Internal notes stay on the client record."
          rows={2}
        />
        <div>
          <Button size="sm" variant="secondary" onClick={() => saveNote.mutate()} disabled={saveNote.isPending}>
            Save note
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {users.length === 0 ? (
          <EmptyState
            title="No portal users yet"
            description="Invite the brand owner by email. They only ever see this client."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-body font-medium">{user.name || user.email}</p>
                  <p className="text-caption text-muted">
                    {user.email}
                    {user.lastLoginAt ? ` · last in ${formatRelativeTime(user.lastLoginAt)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone(user.status === "ACTIVE" ? "ACTIVE" : user.status === "INVITED" ? "PENDING" : "ERROR")}>
                    {user.status === "INVITED" ? "Invited" : user.status === "ACTIVE" ? "Active" : "Revoked"}
                  </Badge>
                  {user.status !== "REVOKED" ? (
                    <>
                      <label className="flex items-center gap-2 text-caption text-muted">
                        <Switch
                          checked={user.canApprove}
                          onCheckedChange={(next) => {
                            if (typeof next === "boolean") {
                              toggleApprove.mutate({ id: user.id, canApprove: next });
                            }
                          }}
                        />
                        <Shield className="size-3.5" aria-hidden="true" />
                        Approve
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(user.id)}
                      >
                        Revoke
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
