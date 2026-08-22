import { APP_NAME } from "@/lib/constants";
import { GlassCard } from "@/components/ui/glass-card";
import { OrbsBackground } from "@/components/layout/orbs-background";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Particles } from "@/components/magicui/particles";
import { Ripple } from "@/components/magicui/ripple";

export function SplashScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-bg px-4">
      <OrbsBackground />
      <Particles quantity={36} />
      <GlassCard className="relative z-10 w-full max-w-sm overflow-hidden px-8 py-10 text-center">
        <Ripple className="opacity-60" mainCircleSize={140} />
        <div className="relative z-[1] flex flex-col items-center gap-3">
          <ClippyMark size={48} />
          <p className="text-section font-semibold tracking-tight">
            <AuroraText>{APP_NAME}</AuroraText>
          </p>
          <p className="coming-soon-pulse text-body text-muted">{label}</p>
        </div>
      </GlassCard>
    </div>
  );
}
