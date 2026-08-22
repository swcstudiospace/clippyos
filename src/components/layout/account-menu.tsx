import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { changeOwnPassword } from "@/lib/server/team-access";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export function AccountMenu() {
  const { user, isPending } = useCurrentUserState();
  const display = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  if (isPending) {
    return <Skeleton className="size-11 rounded-full" aria-hidden="true" />;
  }
  if (!user || !display) return null;

  const label = display.displayName ?? display.primaryEmail ?? "Account";
  const initial = label.charAt(0).toUpperCase();

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Account menu for ${label}`}
        >
          {display.profileImageUrl ? (
            <img
              src={display.profileImageUrl}
              alt=""
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-full bg-secondary-surface text-caption font-medium">
              {initial}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-body text-fg">{label}</span>
            {display.primaryEmail ? (
              <span className="text-caption text-muted">{display.primaryEmail}</span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setPwOpen(true)}>
          <KeyRound className="size-4" />
          Change password
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={() => {
            setSigningOut(true);
            void signOut("/login").catch((error) => {
              setSigningOut(false);
              captureClientError(error, { source: "sign-out" });
              toast.error(userFacingErrorMessage(error));
            });
          }}
        >
          <LogOut className="size-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={pwOpen} onOpenChange={setPwOpen}>
      <DialogContent>
        <DialogTitle>Change password</DialogTitle>
        <DialogDescription>
          Updates the email/password for this account. OAuth logins are unchanged.
        </DialogDescription>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPwBusy(true);
            void changeOwnPassword({
              data: { currentPassword, newPassword },
            })
              .then(() => {
                toast.success("Password updated");
                setPwOpen(false);
                setCurrentPassword("");
                setNewPassword("");
              })
              .catch((error) => {
                captureClientError(error, { source: "change-password" });
                toast.error(userFacingErrorMessage(error));
              })
              .finally(() => setPwBusy(false));
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-pw">Current password</Label>
            <Input
              id="current-pw"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={pwBusy}>
            {pwBusy ? "Saving…" : "Update password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
