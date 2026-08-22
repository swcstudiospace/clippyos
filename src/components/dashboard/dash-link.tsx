import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { DashboardLink } from "@/lib/dashboard";

export function DashLink({
  href,
  className,
  children,
}: {
  href: DashboardLink;
  className?: string;
  children: ReactNode;
}) {
  if (href.to === "/clients/$clientId") {
    return (
      <Link to="/clients/$clientId" params={href.params} className={className}>
        {children}
      </Link>
    );
  }
  if (href.to === "/settings") {
    return (
      <Link to="/settings" hash={href.hash} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to={href.to} className={className}>
      {children}
    </Link>
  );
}
