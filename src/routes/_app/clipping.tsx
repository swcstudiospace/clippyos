import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Clipping cockpit merged into /agent (Crayo automation). Keep this route so old links don't 404. */
export const Route = createFileRoute("/_app/clipping")({
  component: function ClippingRedirect() {
    return <Navigate to="/agent" />;
  },
});
