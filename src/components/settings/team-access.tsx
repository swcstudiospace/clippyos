import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  createMemberResetLink,
  createTeamLogin,
  listTeamLogins,
  revokeTeamLogin,
  setLoginInherit,
  setSuperAdminPassword,
} from "@/lib/server/team-access";
import { getIntegrationsStatus } from "@/lib/server/integrations";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import { formatDate } from "@/lib/format";
import { copyTextToClipboard } from "@/lib/clipboard";
import { userFacingErrorMessage } from "@/lib/errors";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const LOGINS_KEY = ["team-logins"] as const;

export function TeamAccessPanel() {
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const loginsQuery = useQuery({
    queryKey: LOGINS_KEY,
    queryFn: () => listTeamLogins(),
    enabled: statusQuery.data?.role === "admin",
  });
  const isAdmin = statusQuery.data?.role === "admin";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [shareApis, setShareApis] = useState(false);
  const [saPassword, setSaPassword] = useState("");
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createTeamLogin({
        data: {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          inheritWorkspaceApis: role === "admin" ? true : shareApis,
        },
      }),
    onSuccess: async () => {
      toast.success("Login created");
      setName("");
      setEmail("");
      setPassword("");
      setRole("member");
      setShareApis(false);
      await queryClient.invalidateQueries({ queryKey: LOGINS_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => revokeTeamLogin({ data: userId }),
    onSuccess: async () => {
      setRevokeId(null);
      toast.success("Access revoked");
      await queryClient.invalidateQueries({ queryKey: LOGINS_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const saveSa = useMutation({
    mutationFn: () => setSuperAdminPassword({ data: { password: saPassword } }),
    onSuccess: async () => {
      setSaPassword("");
      toast.success("Super Admin password saved");
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const inherit = useMutation({
    mutationFn: (input: { userId: string; inheritWorkspaceApis: boolean }) =>
      setLoginInherit({ data: input }),
    onSuccess: async () => {
      toast.success("API access updated");
      await queryClient.invalidateQueries({ queryKey: LOGINS_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const resetLink = useMutation({
    mutationFn: (userId: string) => createMemberResetLink({ data: userId }),
    onSuccess: async (result) => {
      const ok = await copyTextToClipboard(result.url);
      toast.success(ok ? "Reset link copied" : "Reset link ready — copy failed, check permissions");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function onCreate(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  function onSaveSa(event: FormEvent) {
    event.preventDefault();
    saveSa.mutate();
  }

  const pending = loginsQuery.data?.find((row) => row.userId === revokeId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">Team access</h2>
        <p className="mt-1 text-body text-muted">
          Operators sign in from any network with email, Google, or X. Super Admin
          Access on the login screen uses a password you set here and signs in as
          the workspace owner. New members configure their own APIs unless you
          share workspace APIs with that login.
        </p>
      </div>

      <GlassCard>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
              <UserPlus className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-card font-semibold tracking-tight">Logins</h3>
              <p className="text-caption text-muted">
                Create logins and choose whether they inherit your workspace APIs.
                Owners only.
              </p>
            </div>
          </div>
        </div>

        {!isAdmin ? (
          <p className="mt-4 text-caption text-muted">
            Only owners can create or revoke logins.
          </p>
        ) : loginsQuery.isPending ? (
          <div className="mt-4 flex flex-col gap-2">
            <Skeleton className="h-12 w-full rounded-control" />
            <Skeleton className="h-12 w-full rounded-control" />
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {(loginsQuery.data ?? []).map((row) => {
              const self = row.userId === user?.id;
              return (
                <li
                  key={row.userId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium">
                      {row.name}
                      {self ? " (you)" : ""}
                    </p>
                    <p className="truncate text-caption text-muted">
                      {row.email || "No email"} · added {formatDate(row.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={row.role === "admin" ? "purple" : "neutral"}>
                      {row.role === "admin" ? "Owner" : "Member"}
                    </Badge>
                    <Badge tone={statusTone(row.status)}>{row.status === "ACTIVE" ? "Active" : "Revoked"}</Badge>
                    {row.role === "member" && row.status === "ACTIVE" ? (
                      <label className="flex min-h-11 items-center gap-2 text-caption">
                        <Switch
                          checked={row.inheritWorkspaceApis}
                          disabled={self || inherit.isPending}
                          onCheckedChange={(checked) =>
                            inherit.mutate({
                              userId: row.userId,
                              inheritWorkspaceApis: checked,
                            })
                          }
                          aria-label={`Share workspace APIs with ${row.email || row.name}`}
                        />
                        <span className="max-w-[9.5rem] leading-tight text-muted">
                          {row.inheritWorkspaceApis ? "Uses workspace APIs" : "Own APIs"}
                        </span>
                      </label>
                    ) : row.role === "admin" ? (
                      <span className="text-caption text-muted">Workspace APIs</span>
                    ) : null}
                    {!self && row.status === "ACTIVE" ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resetLink.mutate(row.userId)}
                          disabled={resetLink.isPending}
                        >
                          Reset link
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRevokeId(row.userId)}>
                          Revoke
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {(loginsQuery.data ?? []).length === 0 ? (
              <li className="text-caption text-muted">No logins yet.</li>
            ) : null}
          </ul>
        )}

        {isAdmin ? (
          <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={onCreate}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-name">Name</Label>
              <Input
                id="team-name"
                value={name}
                autoComplete="off"
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-email">Email</Label>
              <Input
                id="team-email"
                type="email"
                value={email}
                autoComplete="off"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-password">Temporary password</Label>
              <Input
                id="team-password"
                type="password"
                value={password}
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-role">Role</Label>
              <select
                id="team-role"
                className="min-h-11 w-full rounded-button border border-border bg-elevated px-3 text-body"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value === "admin" ? "admin" : "member")
                }
              >
                <option value="member">Member</option>
                <option value="admin">Owner</option>
              </select>
            </div>
            {role === "member" ? (
              <label className="flex items-start gap-3 rounded-control bg-secondary-surface/50 px-3 py-3 sm:col-span-2">
                <Switch
                  checked={shareApis}
                  onCheckedChange={setShareApis}
                  aria-label="Share workspace APIs with this login"
                />
                <span className="text-caption leading-snug">
                  <span className="font-medium text-fg">Share workspace APIs</span>
                  <span className="mt-0.5 block text-muted">
                    Off by default. Leave this off so {email.trim() || "this login"} configures
                    their own keys. Turn it on only if they should use your APIs.
                  </span>
                </span>
              </label>
            ) : (
              <p className="text-caption text-muted sm:col-span-2">
                Owners always use workspace APIs.
              </p>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create login"}
              </Button>
            </div>
          </form>
        ) : null}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Shield className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">Super Admin Access</h3>
            <p className="text-caption text-muted">
              Password for the login-screen Super Admin button. It signs in as the
              workspace owner (oveshen.govender@gmail.com). Stored as a hash.
              {statusQuery.data?.superAdminConfigured ? " A password is already set." : " Not set yet."}
            </p>
          </div>
        </div>
        {isAdmin ? (
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSaveSa}>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="sa-password">New Super Admin password</Label>
              <Input
                id="sa-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={saPassword}
                onChange={(event) => setSaPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saveSa.isPending}>
              {saveSa.isPending ? "Saving…" : "Save password"}
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-caption text-muted">Only owners can set this password.</p>
        )}
      </GlassCard>

      <Dialog open={Boolean(pending)} onOpenChange={(open) => { if (!open) setRevokeId(null); }}>
        <DialogContent>
          <DialogTitle>Revoke {pending?.name}?</DialogTitle>
          <DialogDescription>
            They will not be able to sign in until an owner creates a new login.
            Existing sessions stop on the next request.
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              variant="destructive"
              disabled={revoke.isPending || !pending}
              onClick={() => pending && revoke.mutate(pending.userId)}
            >
              Revoke
            </Button>
            <Button variant="ghost" onClick={() => setRevokeId(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
