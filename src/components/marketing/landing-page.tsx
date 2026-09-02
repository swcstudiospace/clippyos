import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Bot,
  Clapperboard,
  HardDrive,
  Kanban,
  MessageCircle,
  MonitorPlay,
  Pause,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { DEMO_ROLES } from "@/lib/demo";
import { PROXY_COUNTRIES, DEFAULT_PROXY_COUNTRY, parseProxyCountry } from "@/lib/social-machine";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useTheme } from "@/lib/theme";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuroraText } from "@/components/magicui/aurora-text";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { BlurFade } from "@/components/magicui/blur-fade";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Marquee } from "@/components/magicui/marquee";
import { ScrollProgress } from "@/components/magicui/scroll-progress";
import { ShineBorder } from "@/components/magicui/shine-border";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { LiquidGlassCanvas } from "@/components/marketing/liquid-glass-canvas";
import { Spotlight } from "@/components/marketing/spotlight";
import { TiltCard } from "@/components/marketing/tilt-card";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { LogoCloud } from "@/components/marketing/logo-cloud";
import { TestimonialsSection } from "@/components/marketing/testimonials";
import { LandingFaq } from "@/components/marketing/faq";
import { toast } from "sonner";

const SHOTS = [
  {
    name: "command",
    title: "Command",
    caption: "The daily OS: pipeline, money, and what to ship next.",
  },
  {
    name: "money",
    title: "Money",
    caption: "Retainers, costs, and collections — the agency ledger.",
  },
  {
    name: "clients",
    title: "Clients",
    caption: "Every roster, plan, and production stage in one place.",
  },
  {
    name: "ideation",
    title: "Ideation",
    caption: "Titles and briefs, scoped per client, ready to produce.",
  },
  {
    name: "agent",
    title: "Agent",
    caption: "Native Hermes loop for clipping work, isolated skills.",
  },
  {
    name: "library",
    title: "Library",
    caption: "Immutable cloud storage for every clip. Content pins as a second layer.",
  },
  {
    name: "approvals",
    title: "Approvals",
    caption: "Nothing public without a sign-off.",
  },
  {
    name: "settings",
    title: "Settings",
    caption: "Add-ons, autonomy, Hermes, and the control plane.",
  },
] as const;

const MARQUEE = [
  "Autonomous clipping",
  "Social Machine",
  "X · YouTube · Instagram · TikTok",
  "Telegram · WhatsApp · Discord",
  "Hermes Agent",
  "Linear kanban",
  "Immutable cloud storage",
  "Hot hibernate",
  "Approvals before publish",
];

const LAYERS = [
  {
    icon: Clapperboard,
    title: "Clip pipeline",
    body: "Ingest, caption, render, and ship. One OS from footage to published cut.",
  },
  {
    icon: MonitorPlay,
    title: "Social Machine",
    body: "Open X, YouTube, Instagram, and TikTok from inside ClippyOS. Hibernate keeps the session hot.",
  },
  {
    icon: MessageCircle,
    title: "Liaison",
    body: "Telegram, WhatsApp, and Discord for customers and companies — professional threads, not browser theatre.",
  },
  {
    icon: Wallet,
    title: "Money",
    body: "Setup fees, retainers, team cost, and collections. The ledger the production OS actually needs.",
  },
  {
    icon: HardDrive,
    title: "Immutable storage",
    body: "Clips live in durable cloud storage, globally reachable. Optional content pins. Never on the machine disk.",
  },
  {
    icon: ShieldCheck,
    title: "Approvals",
    body: "Nothing public without a sign-off. Safety inbox and an audit trail on every publish.",
  },
];

function Shot({
  name,
  alt,
  eager = false,
}: {
  name: string;
  alt: string;
  eager?: boolean;
}) {
  const { theme } = useTheme();
  const contrast = theme === "dark" ? "light" : "dark";
  const src = `/marketing/${name}-${contrast}.gif?v=3`;
  const fallback = `/marketing/${name}-${contrast}.jpg`;
  return (
    <div className="aspect-video w-full overflow-hidden bg-elevated">
      <img
        src={src}
        alt={alt}
        className="marketing-shot"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={(event) => {
          if (event.currentTarget.src.endsWith(fallback)) return;
          event.currentTarget.src = fallback;
        }}
      />
    </div>
  );
}

function AccessButton({ className, label }: { className?: string; label?: string }) {
  const { user } = useCurrentUserState();
  if (user) {
    return (
      <Button asChild className={className}>
        <Link to="/home">{label ?? "Open OS"}</Link>
      </Button>
    );
  }
  return (
    <Button asChild className={className}>
      <a href="/login?intent=access">{label ?? "Get Access"}</a>
    </Button>
  );
}

function DemoForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("agency");
  const [country, setCountry] = useState(DEFAULT_PROXY_COUNTRY);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, role, country, message }),
      });
      const body = (await response.json()) as { ok?: boolean; emailed?: boolean; error?: string };
      if (!response.ok) {
        toast.error(
          body.error === "DEMO_RATE_LIMIT"
            ? "Wait a few seconds before sending another request."
            : "Check the form and try again.",
        );
        setBusy(false);
        return;
      }
      setDone(true);
      toast.success(
        body.emailed
          ? "Request received — check your inbox for confirmation."
          : "Request received. We’ll be in touch.",
      );
    } catch {
      toast.error("Couldn’t send that just now. Retry in a moment.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="liquid-glass liquid-glass-modal rounded-modal p-6">
        <h3 className="text-card font-semibold tracking-tight">You’re on the list.</h3>
        <p className="mt-2 text-body text-muted">
          We sent a confirmation to {email}. We’ll reach out to walk ClippyOS — Social Machine,
          liaison channels, Hermes, and Linear — with your team.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="demo-name">Name</Label>
        <Input id="demo-name" value={name} required minLength={2} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="demo-email">Work email</Label>
        <Input
          id="demo-email"
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="demo-company">Studio / company</Label>
        <Input id="demo-company" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="demo-role">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="demo-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEMO_ROLES.map((item) => (
              <SelectItem key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="demo-country">Country</Label>
        <Select value={country} onValueChange={(value) => setCountry(parseProxyCountry(value))}>
          <SelectTrigger id="demo-country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROXY_COUNTRIES.map((row) => (
              <SelectItem key={row.code} value={row.code}>
                {row.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="demo-message">What do you want to see?</Label>
        <Input
          id="demo-message"
          value={message}
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Roster size, platforms, Hermes / Linear setup…"
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Request a Demo"}
        </Button>
      </div>
    </form>
  );
}

export function LandingPage() {
  const { user } = useCurrentUserState();

  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <LiquidGlassCanvas />
      <Spotlight className="z-[1]" />
      <div className="relative z-10">
      <header className="liquid-glass-nav sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl flex-nowrap items-center justify-between gap-2 px-3 py-2.5 md:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-2">
            <ClippyMark size={28} />
            <span className="truncate text-body font-semibold tracking-tight">{APP_NAME}</span>
          </a>
          <div className="flex shrink-0 flex-nowrap items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="min-h-10 px-2.5">
              <a href="#demo">Demo</a>
            </Button>
            <AccessButton className="min-h-10 px-3 text-caption" />
          </div>
        </div>
        <ScrollProgress />
      </header>

      <main id="top">
        <section className="relative overflow-hidden px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20">
          <AnimatedGridPattern className="opacity-40" />
          <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
            <div className="liquid-glass liquid-glass-modal p-5 md:p-7">
              <BlurFade>
                <div className="liquid-glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1">
                  <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
                  <AnimatedShinyText className="text-caption">{APP_TAGLINE}</AnimatedShinyText>
                </div>
              </BlurFade>
              <BlurFade delay={0.08}>
                <h1 className="mt-5 text-hero font-semibold tracking-tight">
                  <AuroraText>ClippyOS</AuroraText>
                  <span className="mt-2 block text-fg">
                    Clip. Publish. Liaise.{" "}
                    <SparklesText>Autonomously.</SparklesText>
                  </span>
                </h1>
              </BlurFade>
              <BlurFade delay={0.16}>
                <p className="mt-4 max-w-xl text-body text-fg/80">
                  <TypingAnimation duration={16}>
                    Globally reachable clipping OS. Social Machine for X, YouTube, Instagram, and
                    TikTok. Telegram, WhatsApp, and Discord for the people around the work.
                  </TypingAnimation>
                </p>
              </BlurFade>
              <BlurFade delay={0.24}>
                <div className="mt-6 flex flex-wrap gap-3">
                  <AccessButton />
                  <Button asChild variant="secondary">
                    <a href="#demo">Request a Demo</a>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link to="/docs">
                      <BookOpen className="size-4" aria-hidden="true" />
                      Documentation
                    </Link>
                  </Button>
                </div>
                <p className="mt-3 text-caption text-muted">
                  {user
                    ? "You’re signed in. Open the OS to continue."
                    : "Get Access creates a workspace and takes you to checkout. Prefer a walkthrough? Request a Demo."}
                </p>
              </BlurFade>
            </div>
            <BlurFade delay={0.12} className="relative">
              <TiltCard>
                <div className="liquid-glass liquid-glass-modal relative overflow-hidden rounded-modal">
                  <ShineBorder />
                  <BorderBeam />
                  <Shot
                    name="splash"
                    alt="ClippyOS loading — the OS coming online"
                    eager
                  />
                </div>
              </TiltCard>
            </BlurFade>
          </div>
        </section>

        <FeatureGrid />
        <LogoCloud />

        <section className="py-8">
          <Marquee duration={42}>
            {MARQUEE.map((item) => (
              <span
                key={item}
                className="liquid-glass-pill rounded-full px-4 py-1.5 text-caption text-muted"
              >
                {item}
              </span>
            ))}
          </Marquee>
        </section>

        <section id="product" className="px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <BlurFade>
              <Badge tone="teal">Product</Badge>
              <h2 className="mt-3 text-page font-semibold tracking-tight">The OS, in motion.</h2>
              <p className="mt-2 max-w-2xl text-body text-muted">
                Eight live surfaces — Command through Settings. Social Machine and Inbox live
                further down, once each.
              </p>
            </BlurFade>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SHOTS.map((shot, index) => (
                <BlurFade key={shot.title} delay={index * 0.06}>
                  <TiltCard>
                    <article className="liquid-glass relative min-w-0 overflow-hidden rounded-card">
                      <BorderBeam delay={index * 0.4} reverse={index % 2 === 1} />
                      <Shot name={shot.name} alt={`${shot.title} in ClippyOS`} />
                      <div className="p-4">
                        <h3 className="text-card font-semibold tracking-tight">{shot.title}</h3>
                        <p className="mt-1 text-caption text-muted">{shot.caption}</p>
                      </div>
                    </article>
                  </TiltCard>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto max-w-6xl">
            <BlurFade>
              <h2 className="text-page font-semibold tracking-tight">What you actually get</h2>
              <p className="mt-2 max-w-2xl text-body text-muted">
                Benefits of the OS — not the plumbing underneath it.
              </p>
            </BlurFade>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {LAYERS.map((layer) => (
                <article
                  key={layer.title}
                  className="liquid-glass liquid-glass-interactive p-5"
                >
                  <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
                    <layer.icon className="size-5 text-accent" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-card font-semibold tracking-tight">{layer.title}</h3>
                  <p className="mt-2 text-caption text-muted">{layer.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="machine" className="px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
            <BlurFade>
              <Badge tone="green">Social Machine</Badge>
              <h2 className="mt-3 text-page font-semibold tracking-tight">
                Social apps, inside the OS.
              </h2>
              <p className="mt-3 text-body text-muted">
                Start the Social Machine when you need X, YouTube, Instagram, or TikTok. Hibernate
                when you’re done — the session stays hot. Resume picks up the same windows.
              </p>
              <ul className="mt-5 flex flex-col gap-3 text-body text-muted">
                <li className="flex gap-2">
                  <Pause className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  Hibernate, don’t destroy. Logins persist.
                </li>
                <li className="flex gap-2">
                  <MonitorPlay className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  Four networks from one machine, operated from Command.
                </li>
                <li className="flex gap-2">
                  <HardDrive className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  Clips never live on the machine. Immutable cloud storage is the library.
                </li>
              </ul>
            </BlurFade>
            <TiltCard>
              <div className="liquid-glass liquid-glass-modal relative overflow-hidden rounded-modal">
                <ShineBorder />
                <Shot name="social" alt="Social Machine inside ClippyOS" />
              </div>
            </TiltCard>
          </div>
        </section>

        <section id="inbox" className="px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
            <BlurFade>
              <Badge tone="teal">Liaison</Badge>
              <h2 className="mt-3 text-page font-semibold tracking-tight">
                Telegram, WhatsApp, and Discord.
              </h2>
              <p className="mt-3 max-w-2xl text-body text-muted">
                Customers and companies belong in Inbox — Bot API threads, not a browser on the
                Social Machine. Discord still runs the Status Agent against production stages.
                Webhooks never start the machine.
              </p>
            </BlurFade>
            <TiltCard>
              <div className="liquid-glass liquid-glass-modal relative overflow-hidden rounded-modal">
                <ShineBorder />
                <Shot
                  name="inbox"
                  alt="Inbox — Telegram, WhatsApp, and Discord liaison"
                />
              </div>
            </TiltCard>
          </div>
        </section>

        <section id="native" className="px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
            <article className="liquid-glass liquid-glass-interactive p-6">
              <Bot className="size-6 text-accent" aria-hidden="true" />
              <h3 className="mt-3 text-card font-semibold tracking-tight">Native Hermes Agent</h3>
              <p className="mt-2 text-body text-muted">
                ClippyOS speaks Hermes natively — MCP tools, playbooks, and the agent loop live
                in the OS. Skills run isolated. The Social Machine stays a specialist runtime.
              </p>
            </article>
            <article className="liquid-glass liquid-glass-interactive p-6">
              <Kanban className="size-6 text-accent" aria-hidden="true" />
              <h3 className="mt-3 text-card font-semibold tracking-tight">Native Linear kanban</h3>
              <p className="mt-2 text-body text-muted">
                Failed jobs, renders, and agent runs map to Linear. The board stays in Linear —
                ClippyOS deep-links and syncs. Engineering and ops share one kanban.
              </p>
            </article>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto max-w-6xl">
            <BlurFade>
              <Badge tone="teal">Storage</Badge>
              <h2 className="mt-3 text-page font-semibold tracking-tight">
                Immutable cloud. Optional pins.
              </h2>
              <p className="mt-3 max-w-2xl text-body text-muted">
                Every clip lands in durable, globally reachable storage. Pinning strategies —
                eager, on publish, replicate, or manual — copy onto the content network without
                ever using the Social Machine as a disk.
              </p>
            </BlurFade>
          </div>
        </section>

        <TestimonialsSection />

        <section id="demo" className="px-4 pb-16 pt-8 md:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div>
              <Badge tone="green">Access</Badge>
              <h2 className="mt-3 text-page font-semibold tracking-tight">
                Subscribe, or request a demo.
              </h2>
              <p className="mt-3 text-body text-muted">
                Get Access creates your workspace and continues to checkout. Request a Demo if
                you want us to walk Command, the Social Machine, liaison, Hermes, and Linear with
                your team first.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <AccessButton />
                <Button asChild variant="secondary">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            </div>
            <div className="liquid-glass liquid-glass-modal relative overflow-hidden rounded-modal p-6">
              <ShineBorder />
              <h3 className="relative z-[1] text-card font-semibold tracking-tight">Request a Demo</h3>
              <p className="relative z-[1] mt-1 mb-4 text-caption text-muted">
                You’ll get a confirmation email in the ClippyOS look.
              </p>
              <div className="relative z-[1]">
                <DemoForm />
              </div>
            </div>
          </div>
        </section>

        <LandingFaq />
      </main>

      <footer className="liquid-glass-nav px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ClippyMark size={24} />
            <span className="text-caption text-muted">
              {APP_NAME} · {APP_TAGLINE}
            </span>
          </div>
          <p className="text-caption text-muted">Globally reachable. Immutable storage. Hot hibernate.</p>
        </div>
      </footer>
      </div>
    </div>
  );
}
