import { useId } from "react";
import { NumberTicker } from "@/components/magicui/number-ticker";

const FEATURES = [
  {
    value: 4,
    suffix: "",
    title: "Networks inside the OS",
    description: "X, YouTube, Instagram, and TikTok — opened from the Social Machine, not a pile of browsers.",
  },
  {
    value: 3,
    suffix: "",
    title: "Liaison channels",
    description: "Telegram, WhatsApp, and Discord for customers and companies. Threads, not theatre.",
  },
  {
    value: 1,
    suffix: "",
    title: "Social Machine to hibernate",
    description: "Start Daytona when you need the networks. Hibernate when you don’t. Grok Bot stays the always-on alternative.",
  },
  {
    value: 0,
    suffix: "",
    title: "Clips on the machine disk",
    description: "Library is immutable cloud storage. Optional content pins. The VM is never the backend.",
  },
  {
    value: 1,
    suffix: "",
    title: "Native Hermes Agent",
    description: "MCP tools, playbooks, and the agent loop live in ClippyOS. Grok Bot is the premium always-on computer on the same MCP.",
  },
  {
    value: 1,
    suffix: "",
    title: "Linear kanban",
    description: "Failed jobs, renders, and agent runs map to Linear. Engineering and ops share one board.",
  },
  {
    value: 1,
    suffix: "",
    title: "Approvals before publish",
    description: "Nothing public without a sign-off. Safety inbox and an audit trail on every cut.",
  },
  {
    value: 1,
    suffix: "",
    title: "Globally reachable",
    description: "The OS is reachable from anywhere. Storage, liaison, and Command travel with the studio.",
  },
] as const;

const SQUARE_PATTERNS: number[][][] = [
  [[8, 1], [9, 3], [7, 2], [10, 4], [8, 5]],
  [[7, 2], [10, 1], [8, 4], [9, 5], [11, 3]],
  [[9, 1], [8, 3], [10, 2], [7, 5], [11, 4]],
  [[8, 2], [11, 1], [9, 4], [7, 3], [10, 5]],
  [[10, 2], [8, 1], [9, 5], [11, 3], [7, 4]],
  [[7, 1], [9, 2], [10, 5], [8, 4], [11, 1]],
  [[11, 3], [8, 2], [7, 5], [9, 1], [10, 4]],
  [[9, 4], [10, 1], [8, 3], [11, 2], [7, 5]],
];

export function FeatureGrid() {
  return (
    <section id="features" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <article
            key={feature.title}
            className="relative overflow-hidden rounded-modal border border-border bg-gradient-to-b from-secondary-surface to-elevated p-6"
          >
            <Grid size={20} squares={SQUARE_PATTERNS[index]} />
            <p className="relative z-20 text-section font-semibold tracking-tight tabular-nums">
              <NumberTicker value={feature.value} suffix={feature.suffix} />
            </p>
            <h3 className="relative z-20 mt-2 text-body font-semibold tracking-tight">{feature.title}</h3>
            <p className="relative z-20 mt-2 text-caption text-muted">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Grid({ size = 20, squares }: { size?: number; squares: number[][] }) {
  return (
    <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-teal/10 opacity-100 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
        <GridPattern
          width={size}
          height={size}
          x="-12"
          y="4"
          squares={squares}
          className="absolute inset-0 h-full w-full fill-fg/10 stroke-fg/10 mix-blend-overlay"
        />
      </div>
    </div>
  );
}

function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  className,
}: {
  width: number;
  height: number;
  x: string;
  y: string;
  squares: number[][];
  className?: string;
}) {
  const patternId = useId();
  return (
    <svg aria-hidden="true" className={className}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(([sx, sy]) => (
          <rect
            key={`${sx}-${sy}`}
            strokeWidth="0"
            width={width + 1}
            height={height + 1}
            x={sx * width}
            y={sy * height}
          />
        ))}
      </svg>
    </svg>
  );
}
