import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "What is ClippyOS?",
    answer:
      "ClippyOS is the autonomous operating system for clipping. Command runs the day. The Social Machine opens X, YouTube, Instagram, and TikTok from inside the OS. Inbox handles Telegram, WhatsApp, and Discord. Clips live in immutable cloud storage — never on the machine disk.",
  },
  {
    question: "How does the Social Machine work?",
    answer:
      "Start it when you need the networks. Hibernate when you don’t. Logins persist because we pause the session instead of destroying it. Four networks, one machine, operated from Command.",
  },
  {
    question: "Do clips live on the machine?",
    answer:
      "No. The Social Machine is a specialist runtime, not a disk. Every clip lands in durable, globally reachable storage. Pinning strategies — eager, on publish, replicate, or manual — copy onto the content network as a second layer.",
  },
  {
    question: "Where do clients actually talk to us?",
    answer:
      "Inbox. Telegram Bot API, WhatsApp Cloud API, and Discord for customers and companies. Liaison never starts the Social Machine. Discord still runs the Status Agent against production stages.",
  },
  {
    question: "Is Hermes Agent and Linear built in?",
    answer:
      "Yes. ClippyOS speaks Hermes natively — MCP tools, playbooks, and isolated skills. Grok Bot is a premium optional computer on the same Remote MCP: SuperGrok teammates add ClippyOS as a Custom connector (URL + Bearer token) and pick up a work inbox. Failed jobs, renders, and agent runs map to Linear. The board stays in Linear; the OS deep-links and syncs.",
  },
  {
    question: "How do I get access?",
    answer:
      "Get Access creates a workspace and continues to checkout. Prefer a walkthrough of Command, the Social Machine, liaison, Hermes, and Linear first? Request a Demo and we’ll confirm by email.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="faq" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-4">
        <h2 className="text-center text-page font-semibold tracking-tight">Frequently asked questions</h2>
        <p className="mx-auto max-w-lg text-center text-body text-muted">
          If it isn’t here,{" "}
          <a href="#demo" className="text-accent underline-offset-2 hover:underline">
            request a demo
          </a>{" "}
          and we’ll walk the OS with you.
        </p>
        <div className="mx-auto mt-8 w-full max-w-3xl">
          {FAQS.map((faq) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              open={open}
              setOpen={setOpen}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({
  question,
  answer,
  open,
  setOpen,
}: {
  question: string;
  answer: string;
  open: string | null;
  setOpen: (next: string | null) => void;
}) {
  const isOpen = open === question;
  return (
    <button
      type="button"
      className="mb-4 w-full rounded-card border border-border bg-elevated p-4 text-left shadow-(--shadow-border)"
      onClick={() => setOpen(isOpen ? null : question)}
      aria-expanded={isOpen}
    >
      <div className="flex items-start gap-3">
        <ChevronDown
          className={cn(
            "mt-0.5 size-5 shrink-0 text-fg transition-transform duration-(--motion-fast)",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h3 className="text-body font-medium tracking-tight">{question}</h3>
          <AnimatePresence initial={false}>
            {isOpen ? (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden pt-2 text-caption text-muted"
              >
                {answer}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </button>
  );
}
