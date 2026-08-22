import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

function formatNumber(value: number, decimalPlaces: number) {
  return Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  decimalPlaces = 0,
  className,
  prefix = "",
  suffix = "",
}: {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 90 });
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const safe = Number.isFinite(value) ? value : 0;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.textContent = `${prefix}${formatNumber(safe, decimalPlaces)}${suffix}`;
      return;
    }
    if (!isInView) return;
    const timer = window.setTimeout(() => {
      motionValue.set(direction === "down" ? 0 : safe);
    }, delay * 1000);
    return () => window.clearTimeout(timer);
  }, [
    delay,
    decimalPlaces,
    direction,
    isInView,
    motionValue,
    prefix,
    reduced,
    safe,
    suffix,
  ]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      const node = ref.current;
      if (!node) return;
      node.textContent = `${prefix}${formatNumber(
        Number(latest.toFixed(decimalPlaces)),
        decimalPlaces,
      )}${suffix}`;
    });
    return unsubscribe;
  }, [decimalPlaces, prefix, springValue, suffix]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums tracking-tight", className)}
    >
      {prefix}
      {formatNumber(direction === "down" ? safe : 0, decimalPlaces)}
      {suffix}
    </span>
  );
}
