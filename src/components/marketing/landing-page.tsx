import { memo, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { createScope } from "animejs";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { DEMO_ROLES } from "@/lib/demo";
import { NETWORKS } from "@/lib/clip-engine";
import { PROXY_COUNTRIES, DEFAULT_PROXY_COUNTRY, parseProxyCountry } from "@/lib/social-machine";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useTheme } from "@/lib/theme";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipEngine } from "@/components/marketing/clip-engine";
import { LandingFaq } from "@/components/marketing/faq";
import { announce, mountLandingMotion } from "@/components/marketing/anime/landing-motion";
import { ScrollHud } from "@/components/marketing/anime/scroll-hud";
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
    name: "social",
    title: "Social Machine",
    caption: "X, YouTube, Instagram, and TikTok from one machine. Hibernate keeps it hot.",
  },
  {
    name: "inbox",
    title: "Inbox",
    caption: "Telegram, WhatsApp, and Discord liaison for customers and companies.",
  },
  {
    name: "settings",
    title: "Settings",
    caption: "Add-ons, autonomy, Hermes, and the control plane.",
  },
] as const;

const PIPELINE = [
  {
    num: "01",
    chapter: "Find the hooks",
    body: "Highlight detection marks the moments worth cutting in each client’s footage.",
  },
  {
    num: "02",
    chapter: "Cut the clips",
    body: "Every hook becomes its own clip, trimmed to the moment and filed to its client.",
  },
  {
    num: "03",
    chapter: "Caption and render",
    body: "Captions go on, and each clip renders vertical and platform-ready into the Library.",
  },
] as const;

const OS_LAYERS = [
  {
    label: "Native Hermes Agent",
    body: "MCP tools, playbooks, and isolated skills live in the OS.",
  },
  {
    label: "Linear kanban",
    body: "Failed jobs, renders, and agent runs map to Linear. Engineering and ops share one board.",
  },
  {
    label: "Liaison",
    body: "Telegram, WhatsApp, and Discord threads for customers and companies, in Inbox.",
  },
  {
    label: "Money",
    body: "Setup fees, retainers, team cost, and collections — the agency ledger.",
  },
] as const;

function Shot({ name, alt }: { name: string; alt: string }) {
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
        loading="lazy"
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
      <Button asChild className={className} data-magnet>
        <Link to="/home">
          {label ?? "Open OS"} <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    );
  }
  return (
    <Button asChild className={className} data-magnet>
      <a href="/login?intent=access">
        {label ?? "Get Access"} <ArrowUpRight className="size-4" aria-hidden="true" />
      </a>
    </Button>
  );
}

function AccessNote() {
  const { user } = useCurrentUserState();
  return (
    <p className="ce-note-line" data-hero-item>
      {user
        ? "You’re signed in. Open the OS to continue."
        : "Get Access creates a workspace and takes you to checkout. Prefer a walkthrough? Request a Demo."}
    </p>
  );
}

function Status({ live }: { live: boolean }) {
  return (
    <span className={live ? "ce-status ce-status--live" : "ce-status ce-status--rolling"}>
      {live ? "Live" : "Rolling out"}
    </span>
  );
}

function Chapter({
  name,
  id,
  className,
  children,
}: {
  name: string;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={className ? `ce-chapter ${className}` : "ce-chapter"}
      id={id}
      data-chapter={name}
    >
      <div className="ce-chapter__inner">{children}</div>
    </article>
  );
}

const EngineSpine = memo(function EngineSpine() {
  return (
    <section className="ce-spine" id="engine" data-spine aria-label="How ClippyOS works">
      <ClipEngine />
      <div className="ce-chapters">
        <article className="ce-chapter ce-chapter--hero" id="top" data-chapter="Engine">
          <div className="ce-chapter__inner">
            <p className="ce-eyebrow" data-hero-item>
              <span className="ce-live-dot" /> {APP_NAME} · {APP_TAGLINE}
            </p>
            <h1 data-hero-title>
              Clip. Publish. Liaise. <em>Autonomously.</em>
            </h1>
            <p className="ce-hero-sub" data-hero-item>
              Globally reachable clipping OS. Social Machine for X, YouTube, Instagram, and TikTok.
              Telegram, WhatsApp, and Discord for the people around the work.
            </p>
            <div className="ce-actions" data-hero-item>
              <AccessButton />
              <Button asChild variant="secondary" data-magnet>
                <a href="#demo">Request a Demo</a>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/docs">
                  <BookOpen className="size-4" aria-hidden="true" />
                  Documentation
                </Link>
              </Button>
            </div>
            <AccessNote />
            <div className="ce-meta" data-hero-item>
              <span>Approvals before publish</span>
              <i />
              <span>Immutable storage</span>
              <i />
              <span>Hot hibernate</span>
            </div>
          </div>
          <div className="ce-scroll-cue" data-hero-item aria-hidden="true">
            <span className="ce-scroll-cue__line" />
            Scroll to run the engine
          </div>
        </article>

        <Chapter name="Footage in" id="pipeline">
          <p className="ce-eyebrow" data-reveal>
            01 / The clip engine
          </p>
          <h2 className="ce-title" data-split>
            Footage in. <em>Clips out.</em>
          </h2>
          <p className="ce-lede" data-reveal>
            The clip engine takes a client’s long-form footage to platform-ready shorts: ingest,
            highlight detection, captioning, and render. It rides the library, render-job,
            publisher, and approval rails that already run in production.
          </p>
          <p className="ce-note" data-reveal>
            <Status live={false} /> AutoClip runs through Crayo in /agent today. The native pipeline
            is rolling out.
          </p>
        </Chapter>

        {PIPELINE.map((step, index) => (
          <Chapter name={step.chapter} className="ce-chapter--step" key={step.num}>
            {index === 0 ? (
              <p className="ce-eyebrow" data-reveal>
                02 / The pipeline · rolling out
              </p>
            ) : null}
            <div className="ce-step" data-reveal>
              <span className="ce-step__num">{step.num}</span>
              <h3 className="ce-title">{step.chapter}</h3>
              <p className="ce-lede">{step.body}</p>
            </div>
          </Chapter>
        ))}

        <Chapter name="Approvals" id="approvals">
          <p className="ce-eyebrow" data-reveal>
            03 / Approvals
          </p>
          <h2 className="ce-title" data-split>
            Nothing public <em>without a sign-off.</em>
          </h2>
          <p className="ce-lede" data-reveal>
            Every publish routes through /approvals, with a safety inbox and an audit trail on every
            cut. Autonomy stays leashed: social uploads default to draft.
          </p>
          <p className="ce-note" data-reveal>
            <Status live /> Human approval gates ship today.
          </p>
        </Chapter>

        <Chapter name="Social Machine" id="machine">
          <p className="ce-eyebrow" data-reveal>
            04 / Social Machine
          </p>
          <h2 className="ce-title" data-split>
            Four networks. <em>One machine.</em>
          </h2>
          <p className="ce-lede" data-reveal>
            Start the Social Machine when you need X, YouTube, Instagram, or TikTok. Hibernate when
            you’re done — the session stays hot, logins persist, and Resume picks up the same
            windows.
          </p>
          <ul className="ce-chips" data-reveal>
            {NETWORKS.map((network) => (
              <li key={network}>{network}</li>
            ))}
          </ul>
        </Chapter>

        <Chapter name="Library" id="library">
          <p className="ce-eyebrow" data-reveal>
            05 / Library
          </p>
          <h2 className="ce-title" data-split>
            Immutable cloud. <em>Optional pins.</em>
          </h2>
          <p className="ce-lede" data-reveal>
            Every clip lands in durable, globally reachable storage — never on the machine disk.
            Pinning strategies — eager, on publish, replicate, or manual — copy onto the content
            network as a second layer.
          </p>
        </Chapter>

        <Chapter name="Hermes loop" id="native">
          <p className="ce-eyebrow" data-reveal>
            06 / The OS around the work
          </p>
          <h2 className="ce-title" data-split>
            Hermes runs the loop. <em>You run the agency.</em>
          </h2>
          <ul className="ce-list">
            {OS_LAYERS.map((layer) => (
              <li key={layer.label} data-reveal>
                <b>{layer.label}</b>
                <Status live />
                <small>{layer.body}</small>
              </li>
            ))}
          </ul>
        </Chapter>

        <Chapter name="Online" className="ce-chapter--final">
          <p className="ce-eyebrow" data-reveal>
            Online
          </p>
          <h2 className="ce-title" data-split>
            The engine is idle. <em>Start it.</em>
          </h2>
          <p className="ce-lede" data-reveal>
            Get Access creates your workspace and continues to checkout. Request a Demo if you want
            us to walk Command, the Social Machine, liaison, Hermes, and Linear with your team
            first.
          </p>
          <div className="ce-actions" data-reveal>
            <AccessButton />
            <Button asChild variant="secondary" data-magnet>
              <a href="#demo">Request a Demo</a>
            </Button>
          </div>
        </Chapter>
      </div>
    </section>
  );
});

function DemoForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("agency");
  const [country, setCountry] = useState(DEFAULT_PROXY_COUNTRY);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (done) announce(heading.current, "You’re on the list.");
  }, [done]);

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
      <div className="rounded-card border border-border bg-elevated p-6" role="status">
        <h3 ref={heading} className="text-card font-semibold tracking-tight">
          You’re on the list.
        </h3>
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
        <Input
          id="demo-name"
          value={name}
          required
          minLength={2}
          onChange={(e) => setName(e.target.value)}
        />
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

function Surfaces() {
  return (
    <section id="product" className="lp-section" data-chapter="The OS in motion">
      <p className="lp-kicker" data-reveal>
        07 / The OS, in motion
      </p>
      <div className="lp-heading">
        <h2 data-split>
          Ten live surfaces. <em>One OS.</em>
        </h2>
        <p data-reveal>
          Command through Settings, plus the Social Machine and Inbox — captured from the running
          product.
        </p>
      </div>
      <div className="lp-shots" data-stagger>
        {SHOTS.map((shot, index) => (
          <article key={shot.name} className="lp-shot">
            <Shot name={shot.name} alt={`${shot.title} in ClippyOS`} />
            <div className="lp-shot__body">
              <span className="lp-shot__num">{String(index + 1).padStart(2, "0")}</span>
              <h3>{shot.title}</h3>
              <p>{shot.caption}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Access() {
  return (
    <section id="demo" className="lp-section lp-access" data-chapter="Access">
      <div>
        <p className="lp-kicker" data-reveal>
          08 / Access
        </p>
        <div className="lp-heading">
          <h2 data-split>
            Subscribe, or <em>request a demo.</em>
          </h2>
          <p data-reveal>
            Get Access creates your workspace and continues to checkout. Request a Demo if you want
            us to walk Command, the Social Machine, liaison, Hermes, and Linear with your team
            first.
          </p>
        </div>
        <div className="ce-actions" data-reveal>
          <AccessButton />
          <Button asChild variant="secondary">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
      <div className="lp-form" data-reveal>
        <h3 className="text-card font-semibold tracking-tight">Request a Demo</h3>
        <p className="mt-1 mb-4 text-caption text-muted">
          You’ll get a confirmation email in the ClippyOS look.
        </p>
        <DemoForm />
      </div>
    </section>
  );
}

export function LandingPage() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = createScope({ root }).add(() => {
      if (root.current) return mountLandingMotion(root.current);
    });
    return () => {
      scope.revert();
    };
  }, []);

  return (
    <div className="landing relative min-h-dvh bg-bg text-fg" ref={root}>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-bg/80 backdrop-blur-md">
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
      </header>

      <main>
        <EngineSpine />
        <Surfaces />
        <Access />
        <LandingFaq />
      </main>

      <footer className="lp-footer border-t border-border px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ClippyMark size={24} />
            <span className="text-caption text-muted">
              {APP_NAME} · {APP_TAGLINE}
            </span>
          </div>
          <p className="text-caption text-muted">
            Globally reachable. Immutable storage. Hot hibernate.
          </p>
        </div>
      </footer>
      <ScrollHud />
    </div>
  );
}
