import type { ReactNode } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  sparkle = false,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  sparkle?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <BlurFade>
          <h1 className="text-page font-semibold tracking-tight">
            {sparkle ? (
              <SparklesText>{title}</SparklesText>
            ) : (
              <AnimatedShinyText>{title}</AnimatedShinyText>
            )}
          </h1>
        </BlurFade>
        {description ? (
          <BlurFade delay={0.08}>
            <p className="mt-2 max-w-xl text-body text-muted">{description}</p>
          </BlurFade>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
