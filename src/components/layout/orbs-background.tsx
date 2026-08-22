import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";

export function OrbsBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="orb orb-blue" />
      <div className="orb orb-teal" />
      <div className="orb orb-purple" />
      <AnimatedGridPattern className="opacity-35" />
    </div>
  );
}
