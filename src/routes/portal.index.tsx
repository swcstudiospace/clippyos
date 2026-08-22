import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/")({
  component: PortalIndex,
});

function PortalIndex() {
  return <Navigate to="/portal/home" />;
}
