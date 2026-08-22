import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.35,
  yOffset = 10,
  inView = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  inView?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, filter: "blur(6px)" }}
      whileInView={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      animate={!inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
