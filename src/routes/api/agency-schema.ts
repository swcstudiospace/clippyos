import { createFileRoute } from "@tanstack/react-router";
import { agencySchemaSql } from "@/lib/supabase/schema";

export const Route = createFileRoute("/api/agency-schema")({
  server: {
    handlers: {
      GET: () =>
        new Response(agencySchemaSql, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": 'attachment; filename="agency-admin-schema.sql"',
            "Cache-Control": "no-store",
          },
        }),
    },
  },
});
