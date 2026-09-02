import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

const LOGOS_PER_ROW = 4;

const LOGOS: { title: string; mark: ReactNode }[] = [
  { title: "Daytona", mark: <DaytonaMark /> },
  { title: "Supabase", mark: <SupabaseMark /> },
  { title: "Telegram", mark: <TelegramMark /> },
  { title: "WhatsApp", mark: <WhatsAppMark /> },
  { title: "Discord", mark: <DiscordMark /> },
  { title: "Whop", mark: <WhopMark /> },
  { title: "Hermes Agent", mark: <NousMark /> },
  { title: "Grok Bot", mark: <GrokBotMark /> },
];

export function LogoCloud() {
  const setCount = Math.ceil(LOGOS.length / LOGOS_PER_ROW);
  const [setIndex, setSetIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSetIndex((i) => (i + 1) % setCount);
    }, 2800);
    return () => window.clearInterval(id);
  }, [setCount]);

  const visible = LOGOS.slice(setIndex * LOGOS_PER_ROW, setIndex * LOGOS_PER_ROW + LOGOS_PER_ROW);

  return (
    <section className="border-y border-border bg-elevated/40 px-4 py-10 md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 md:flex-row md:gap-8">
        <h2 className="shrink-0 text-center text-caption font-medium tracking-tight text-muted md:text-left">
          Infrastructure we run on
        </h2>
        <div className="grid min-h-12 w-full grid-cols-2 items-center justify-items-center gap-4 sm:grid-cols-4 md:flex md:flex-1 md:justify-between">
          <AnimatePresence mode="popLayout">
            {visible.map((logo, index) => (
              <motion.div
                key={logo.title}
                initial={{ opacity: 0, x: -16, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 16, filter: "blur(8px)" }}
                transition={{ duration: 0.22, ease: "easeInOut", delay: index * 0.08 }}
                className="flex w-full items-center justify-center gap-2 text-fg"
              >
                <span className="grid size-7 place-items-center text-fg" aria-hidden="true">
                  {logo.mark}
                </span>
                <span className="text-caption font-medium tracking-tight">{logo.title}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function DaytonaMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
      <path d="M12 2.2 13.1 10 21 12l-7.9 2L12 21.8 10.9 14 3 12l7.9-2z" />
    </svg>
  );
}

function SupabaseMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
      <path d="M12.8 2.1c.4-.7 1.4-.4 1.4.5v8.7h6c.9 0 1.3 1.1.7 1.7l-8.9 9.9c-.5.6-1.5.2-1.4-.6v-8.8H4.6c-.9 0-1.3-1.1-.6-1.7z" />
    </svg>
  );
}

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
      <path d="M21.5 4.3 2.8 11.4c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3.9 0 .6.3l-9 8.6-.3 4.7c.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9l3.3-15.5c.3-1.4-.5-2-1.8-1.5z" />
    </svg>
  );
}

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.5 2 2 6.4 2 11.9c0 1.7.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.4 10-9.9S17.54 2 12.04 2zm5.8 14.1c-.2.7-1.2 1.2-1.9 1.3-.5.1-1.1.2-3.6-.8-3.1-1.3-5.1-4.5-5.3-4.7-.2-.2-1.5-2-1.5-3.8s1-2.7 1.3-3.1c.3-.3.7-.4 1-.4h.7c.2 0 .5 0 .7.6.3.7.9 2.5 1 2.6.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.2.7.2.4.9 1.5 2 2.4 1.3 1.2 2.5 1.6 2.8 1.8.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.9.9 2.2 1.1.3.2.5.2.6.4.1.2 0 .8-.2 1.5z" />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
      <path d="M19.3 5.1A17 17 0 0 0 15.1 4l-.4.7a16 16 0 0 1 3.2 1.2 14.6 14.6 0 0 0-12 0A16 16 0 0 1 8.9 4.7L8.5 4a17 17 0 0 0-4.2 1.1C2.2 9.1 1.6 12.9 1.9 16.7A17 17 0 0 0 7 19l.7-1.1a11 11 0 0 1-1.8-.9l.4-.3a12.4 12.4 0 0 0 10.4 0l.4.3a11 11 0 0 1-1.8.9l.7 1.1a17 17 0 0 0 5.1-2.3c.4-4.3-.3-8-1.8-11.6zM9.7 14.5c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7zm4.6 0c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.6 1.7-1.5 1.7z" />
    </svg>
  );
}

function WhopMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
      <path d="M2.5 6.5h3.2l1.9 8.1L9.9 6.5h3.4l2.3 8.1 1.9-8.1h3l-3.3 11.5h-3.5l-2.2-7.6-2.2 7.6H5.8z" />
    </svg>
  );
}

function NousMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M8 12.5c1.4 2 2.6 3 4 3s2.6-1 4-3" />
      <circle cx="9.2" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GrokBotMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
      <path d="M12 2.4 13.8 9 21 12l-7.2 3L12 21.6 10.2 15 3 12l7.2-3z" />
    </svg>
  );
}
