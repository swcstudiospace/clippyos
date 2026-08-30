import { createFileRoute } from "@tanstack/react-router";
import { applySecurityHeaders } from "@/lib/security-headers";
import { authorizeCronRequest } from "@/lib/server/cron-auth.server";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: applySecurityHeaders(
      new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      }),
    ),
  });
}

export const Route = createFileRoute("/api/cron/ops")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorizeCronRequest(request)) {
          return json(401, { error: { code: "UNAUTHORIZED", message: "Cron auth failed." } });
        }
        let linearSwept = 0;
        try {
          const { sweepLinearQueue } = await import("@/lib/server/linear.server");
          linearSwept = await sweepLinearQueue(8);
        } catch {
          linearSwept = 0;
        }
        let machineState = "unknown";
        try {
          const { getSocialMachineStatus } = await import("@/lib/server/daytona.server");
          const status = await getSocialMachineStatus();
          machineState = status.state;
        } catch {
          machineState = "unknown";
        }
        return json(200, {
          ok: true,
          linearSwept,
          machineState,
          startedMachine: false,
          note: "Cron never starts the Social Machine. Idle pause is owned by Daytona. Hibernate is pause, not destroy.",
        });
      },
    },
  },
});
