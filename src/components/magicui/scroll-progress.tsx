import { motion, useScroll, useSpring } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function ScrollProgress({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-linear-to-r from-teal via-accent to-purple",
        className,
      )}
      style={{ scaleX: reduced ? 0 : scaleX }}
    />
  );
}
