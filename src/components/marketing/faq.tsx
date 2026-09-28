import { ChevronDown } from "lucide-react";

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
  return (
    <section id="faq" className="lp-section" aria-labelledby="faq-heading" data-chapter="FAQ">
      <p className="lp-kicker" data-reveal>
        09 / FAQ
      </p>
      <div className="lp-heading">
        <h2 id="faq-heading" data-split>
          Frequently asked <em>questions.</em>
        </h2>
        <p data-reveal>
          If it isn’t here,{" "}
          <a href="#demo" className="text-accent underline-offset-2 hover:underline">
            request a demo
          </a>{" "}
          and we’ll walk the OS with you.
        </p>
      </div>
      <div className="lp-faq" data-stagger>
        {FAQS.map((faq) => (
          <details key={faq.question} className="lp-faq__item">
            <summary>
              <span>{faq.question}</span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
