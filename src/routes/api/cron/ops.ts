import { createFileRoute } from "@tanstack/react-router";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function authorized(request: Request): boolean {
  if (request.headers.get("x-vercel-cron") === "1") return true;
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export const Route = createFileRoute("/api/cron/ops")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) {
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
