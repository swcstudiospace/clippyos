import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "badge-shine inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-secondary-surface text-fg",
        blue: "bg-accent/15 text-accent",
        green: "bg-success/15 text-success",
        orange: "bg-warning/15 text-warning",
        red: "bg-danger/15 text-danger",
        purple: "bg-purple/15 text-purple",
        teal: "bg-teal/15 text-teal",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props} />
  );
}

export function statusTone(
  status: string,
): NonNullable<VariantProps<typeof badgeVariants>["tone"]> {
  switch (status) {
    case "PAID":
    case "ACTIVE":
    case "CONNECTED":
    case "CLOSED":
    case "PUBLISHED":
    case "RUNNING":
    case "READY":
    case "SUCCEEDED":
    case "LOGGED_IN":
      return "green";
    case "PENDING":
    case "PROCESSING":
    case "TRANSCRIBING":
    case "IN_TALKS":
    case "CONTACTED":
    case "IN_REVIEW":
    case "QUEUED":
    case "STARTING":
    case "STOPPING":
    case "NEEDS_ATTENTION":
    case "AWAITING_APPROVAL":
    case "WAITING":
      return "orange";
    case "OVERDUE":
    case "LOST":
    case "CHURNED":
    case "ERROR":
    case "FAILED":
    case "CANCELED":
    case "ARCHIVED":
      return "red";
    default:
      return "blue";
  }
}
