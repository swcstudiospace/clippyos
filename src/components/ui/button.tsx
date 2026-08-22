import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-body font-medium transition-[background-color,transform,box-shadow,opacity] duration-(--motion-quick) ease-[var(--ease-out)] motion-safe:active:not-disabled:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "btn-shimmer bg-accent text-accent-fg hover:brightness-110",
        secondary:
          "bg-secondary-surface text-fg hover:bg-secondary-surface/80 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]",
        ghost: "bg-transparent text-fg hover:bg-glass",
        destructive: "btn-shimmer bg-danger text-accent-fg hover:brightness-110",
        rainbow: "rainbow-btn",
      },
      size: {
        default: "min-h-11 px-4",
        sm: "min-h-10 px-3 text-caption",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : type}
      {...props}
    />
  );
}

export { buttonVariants };
