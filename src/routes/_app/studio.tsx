import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Studio generate UI lives on Library. Keep this route so old links don't 404. */
export const Route = createFileRoute("/_app/studio")({
  component: function StudioRedirect() {
    return <Navigate to="/library" search={{ tab: "generate" } as never} />;
  },
});
