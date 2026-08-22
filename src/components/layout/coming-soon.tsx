import { GlassCard } from "@/components/ui/glass-card";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { Meteors } from "@/components/magicui/meteors";
import { Ripple } from "@/components/magicui/ripple";
import { ShineBorder } from "@/components/magicui/shine-border";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-7rem)] items-center justify-center px-1 py-8">
      <GlassCard className="relative w-full max-w-lg overflow-hidden px-8 py-12 text-center">
        <ShineBorder />
        <Meteors number={10} />
        <Ripple className="opacity-50" />
        <h1 className="relative z-[1] text-page font-semibold tracking-tight">
          <SparklesText>{title}</SparklesText>
        </h1>
        <p className="relative z-[1] mt-4 flex items-center justify-center gap-2 text-body text-muted">
          <span
            className="coming-soon-pulse size-1.5 rounded-full bg-accent"
            aria-hidden="true"
          />
          <TypingAnimation>Coming soon</TypingAnimation>
        </p>
      </GlassCard>
    </div>
  );
}
