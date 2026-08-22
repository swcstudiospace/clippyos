import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
} from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

function burst(x: number, y: number) {
  const colors = ["#0a84ff", "#64d2ff", "#bf5af2", "#30d158", "#ff9f0a"];
  for (let i = 0; i < 14; i += 1) {
    const node = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 14;
    const dist = 36 + Math.random() * 28;
    node.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;width:6px;height:6px;border-radius:999px;
      background:${colors[i % colors.length]};pointer-events:none;z-index:80;
      transform:translate(-50%,-50%);
    `;
    document.body.appendChild(node);
    const anim = node.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)`,
          opacity: 0,
        },
      ],
      { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    anim.onfinish = () => node.remove();
  }
}

export function CoolMode({
  children,
}: {
  children: ReactElement<{ onClick?: (event: MouseEvent) => void }>;
}) {
  const reduced = usePrefersReducedMotion();
  if (!isValidElement(children)) return children;
  if (reduced) return children;
  return cloneElement(children, {
    onClick: (event: MouseEvent) => {
      burst(event.clientX, event.clientY);
      children.props.onClick?.(event);
    },
  });
}
