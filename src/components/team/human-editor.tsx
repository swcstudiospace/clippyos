import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HUMAN_ROLES, type Client, type HumanRole, type TeamMember } from "@/lib/entities";
import { ROLE_LABELS } from "@/lib/labels";
import { MONEY_QUERY_KEY } from "@/lib/money";
import { TEAM_QUERY_KEY } from "@/lib/team";
import { userFacingErrorMessage } from "@/lib/errors";
import { createHumanSeatFn, updateHumanSeatFn } from "@/lib/server/team-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function invalidateTeam(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ["client"] });
}

export function HumanEditor({
  open,
  member,
  clients,
  lockedClientId,
  onClose,
}: {
  open: boolean;
  member: TeamMember | null;
  clients: Client[];
  lockedClientId?: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState<HumanRole>("SHORT_FORM_EDITOR");
  const [clientId, setClientId] = useState("");
  const [cost, setCost] = useState("0");

  useEffect(() => {
    if (!open) return;
    if (member) {
      setName(member.name);
      setRole(HUMAN_ROLES.includes(member.role as HumanRole) ? (member.role as HumanRole) : "CHANNEL_MANAGER");
      setClientId(member.clientId ?? lockedClientId ?? "");
      setCost(member.cost ?? "0");
    } else {
      setName("");
      setRole("SHORT_FORM_EDITOR");
      setClientId(lockedClientId ?? clients[0]?.id ?? "");
      setCost("0");
    }
  }, [open, member, clients, lockedClientId]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        role,
        clientId,
        cost: Number(cost) || 0,
      };
      return member
        ? updateHumanSeatFn({ data: { id: member.id, ...payload } })
        : createHumanSeatFn({ data: payload });
    },
    onSuccess: (result) => {
      toast.success(member ? "Teammate updated" : `${result.name} assigned`);
      invalidateTeam(queryClient);
      onClose();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>{member ? "Edit teammate" : "Add human"}</DialogTitle>
        <DialogDescription>
          Humans carry client load and monthly cost. AI teammates are added separately and never
          count as headcount.
        </DialogDescription>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim() && clientId) save.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="human-name">Name</Label>
            <Input
              id="human-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alex"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="human-role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as HumanRole)}>
                <SelectTrigger id="human-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HUMAN_ROLES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ROLE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="human-cost">Monthly cost</Label>
              <Input
                id="human-cost"
                inputMode="decimal"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
              />
            </div>
          </div>
          {lockedClientId ? null : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="human-client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="human-client">
                  <SelectValue placeholder="Pick a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            type="submit"
            className="min-h-11"
            disabled={save.isPending || !name.trim() || !clientId}
          >
            {member ? "Save" : "Assign"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
