import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Testimonial = {
  title: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    title: "Hibernate, don’t destroy",
    quote:
      "We used to lose Instagram sessions every time a box died. ClippyOS pauses the Social Machine. We come back to the same windows.",
    name: "Amelia Croft",
    role: "Studio lead, Northstar Media",
    initials: "AC",
  },
  {
    title: "Clients live in Inbox",
    quote:
      "Telegram, WhatsApp, and Discord sit next to the pipeline. We stopped pasting briefs out of group chats into Notion.",
    name: "Jonah Venter",
    role: "Producer, Cut House",
    initials: "JV",
  },
  {
    title: "Nothing ships unsigned",
    quote:
      "Approvals before publish saved us twice in the first month. The audit trail is the thing agencies actually owe brands.",
    name: "Priya Nair",
    role: "Ops, Frame & Field",
    initials: "PN",
  },
  {
    title: "Money finally matches the day",
    quote:
      "Retainers, team cost, and collections sit on Command. We stopped reconciling three spreadsheets after standup.",
    name: "Luis Ortega",
    role: "Owner, Ortega Clips",
    initials: "LO",
  },
  {
    title: "Hermes is in the OS, not a tab",
    quote:
      "The agent loop, skills, and playbooks live here. We don’t babysit a chat window while a render is running.",
    name: "Hana Berg",
    role: "Editor, Berg Studio",
    initials: "HB",
  },
  {
    title: "Linear is the kanban",
    quote:
      "Failed jobs and agent runs show up on the board we already use. Engineering and clipping share one queue.",
    name: "Marcus Adeyemi",
    role: "CTO, Signal Cut",
    initials: "MA",
  },
  {
    title: "Four networks, one machine",
    quote:
      "X, YouTube, Instagram, TikTok from inside ClippyOS. No more five Chrome profiles and a sticky note of passwords.",
    name: "Sofia Rahman",
    role: "Social lead, Late Drop",
    initials: "SR",
  },
  {
    title: "Clips never sat on the VM",
    quote:
      "Immutable cloud storage is the library. If the machine sleeps, the footage is still there. That was the deal-breaker.",
    name: "Eli Kovacs",
    role: "Post supervisor, Kovacs Co.",
    initials: "EK",
  },
  {
    title: "Demo, then checkout",
    quote:
      "We requested a walkthrough, got the confirmation the same hour, and subscribed when Command made sense for the roster.",
    name: "Nina Walsh",
    role: "Founder, Walsh Agency",
    initials: "NW",
  },
  {
    title: "The day has a command center",
    quote:
      "Pipeline, money, and what to ship next — one screen. Our morning standup is ten minutes because Command already knows.",
    name: "Theo Park",
    role: "EP, Park & Sons",
    initials: "TP",
  },
  {
    title: "Pin on publish, not as a disk",
    quote:
      "We pin after a cut goes live. Content network as a second layer. Nobody treats the Social Machine like a NAS.",
    name: "Ravi Desai",
    role: "Technical producer",
    initials: "RD",
  },
  {
    title: "Discord still talks to stages",
    quote:
      "Status Agent against production stages, not a bot in a vacuum. Clients see progress without us writing updates.",
    name: "Claire Huang",
    role: "Client partner, Huang Edit",
    initials: "CH",
  },
];

type CardItem = {
  id: string;
  testimonial: Testimonial;
  x: number;
  y: number;
  width: number;
  height: number;
};

type FocusPosition = {
  x: number;
  y: number;
  cardId: string;
};

function seededRandom(seed: number): () => number {
  return function next() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function rectanglesOverlap(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number,
  padding = 20,
): boolean {
  return !(
    x1 + w1 + padding < x2 ||
    x2 + w2 + padding < x1 ||
    y1 + h1 + padding < y2 ||
    y2 + h2 + padding < y1
  );
}

function isInWorldCenterZone(
  absoluteX: number,
  absoluteY: number,
  width: number,
  height: number,
  exclusionWidth: number,
  exclusionHeight: number,
): boolean {
  const zoneLeft = -exclusionWidth / 2;
  const zoneRight = exclusionWidth / 2;
  const zoneTop = -exclusionHeight / 2;
  const zoneBottom = exclusionHeight / 2;
  return !(
    absoluteX + width < zoneLeft ||
    absoluteX > zoneRight ||
    absoluteY + height < zoneTop ||
    absoluteY > zoneBottom
  );
}

function generateTileCards(
  tileX: number,
  tileY: number,
  tileSize: number,
  testimonials: Testimonial[],
  cardCount: number,
  exclusionWidth: number,
  exclusionHeight: number,
): CardItem[] {
  const random = seededRandom(tileX * 10000 + tileY);
  const cards: CardItem[] = [];
  const minGap = 80;
  for (let i = 0; i < cardCount; i += 1) {
    const testimonial = testimonials[Math.abs(tileX * cardCount + tileY + i) % testimonials.length];
    const baseWidth = 360 + random() * 50;
    const height = 196 + random() * 24;
    let x = 0;
    let y = 0;
    let attempts = 0;
    let valid = false;
    while (attempts < 80 && !valid) {
      x = random() * (tileSize - baseWidth - 80) + 40;
      y = random() * (tileSize - height - 80) + 40;
      const absX = tileX * tileSize + x;
      const absY = tileY * tileSize + y;
      if (isInWorldCenterZone(absX, absY, baseWidth, height, exclusionWidth, exclusionHeight)) {
        attempts += 1;
        continue;
      }
      valid = cards.every(
        (card) =>
          !rectanglesOverlap(x, y, baseWidth, height, card.x, card.y, card.width, card.height, minGap),
      );
      attempts += 1;
    }
    if (valid) {
      cards.push({
        id: `${tileX}-${tileY}-${i}`,
        testimonial,
        x,
        y,
        width: baseWidth,
        height,
      });
    }
  }
  return cards;
}

function generateFocusPositions(
  count: number,
  tileSize: number,
  testimonials: Testimonial[],
  cardsPerTile: number,
  exclusionWidth: number,
  exclusionHeight: number,
): FocusPosition[] {
  const positions: FocusPosition[] = [];
  for (let tx = -3; tx <= 3 && positions.length < count; tx += 1) {
    for (let ty = -3; ty <= 3 && positions.length < count; ty += 1) {
      if (tx === 0 && ty === 0) continue;
      const cards = generateTileCards(
        tx,
        ty,
        tileSize,
        testimonials,
        cardsPerTile,
        exclusionWidth,
        exclusionHeight,
      );
      if (!cards[0]) continue;
      const card = cards[0];
      positions.push({
        x: tx * tileSize + card.x + card.width / 2,
        y: ty * tileSize + card.y + card.height / 2,
        cardId: card.id,
      });
    }
  }
  return positions;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/20 text-caption font-semibold text-accent">
      {initials}
    </span>
  );
}

export function TestimonialsSection() {
  return (
    <section id="stories" className="relative">
      <TestimonialsCanvas>
        <div className="liquid-glass liquid-glass-modal max-w-2xl px-6 py-8 text-center">
            <motion.h2
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="text-page font-semibold tracking-tight md:text-hero"
            >
              Studios already living in the OS
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="mx-auto mt-4 max-w-md text-body text-muted"
            >
              Drag the canvas. Operators talk about hibernate, Inbox, approvals, Hermes, and Linear
              — the work, not the plumbing.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.55, delay: 0.45 }}
              className="mt-8"
            >
              <Button asChild>
                <a href="#demo">
                  Request a Demo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </motion.div>
          </div>
      </TestimonialsCanvas>
    </section>
  );
}

function TestimonialsCanvas({ children }: { children?: ReactNode }) {
  const tileSize = 800;
  const cardsPerTile = 4;
  const exclusionWidth = 700;
  const exclusionHeight = 560;
  const autoPanInterval = 3200;
  const autoPanDuration = 1100;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  const autoPanRafRef = useRef<number | null>(null);
  const autoPanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoPanningRef = useRef(false);
  const focusIndexRef = useRef(0);
  const focusPositionsRef = useRef<FocusPosition[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [visibleTiles, setVisibleTiles] = useState<
    { tileX: number; tileY: number; cards: CardItem[] }[]
  >([]);

  const updateVisibleTiles = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const { x, y } = offsetRef.current;
    const startTileX = Math.floor(x / tileSize) - 1;
    const startTileY = Math.floor(y / tileSize) - 1;
    const endTileX = Math.ceil((x + width) / tileSize) + 1;
    const endTileY = Math.ceil((y + height) / tileSize) + 1;
    const tiles: { tileX: number; tileY: number; cards: CardItem[] }[] = [];
    for (let tx = startTileX; tx <= endTileX; tx += 1) {
      for (let ty = startTileY; ty <= endTileY; ty += 1) {
        tiles.push({
          tileX: tx,
          tileY: ty,
          cards: generateTileCards(
            tx,
            ty,
            tileSize,
            TESTIMONIALS,
            cardsPerTile,
            exclusionWidth,
            exclusionHeight,
          ),
        });
      }
    }
    setVisibleTiles(tiles);
  }, []);

  const updateTransform = useCallback(() => {
    if (!contentRef.current) return;
    const { x, y } = offsetRef.current;
    contentRef.current.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
  }, []);

  const animate = useCallback(() => {
    if (isDraggingRef.current) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }
    velocityRef.current.x *= 0.95;
    velocityRef.current.y *= 0.95;
    if (Math.abs(velocityRef.current.x) > 0.5 || Math.abs(velocityRef.current.y) > 0.5) {
      offsetRef.current.x -= velocityRef.current.x;
      offsetRef.current.y -= velocityRef.current.y;
      updateTransform();
      updateVisibleTiles();
      rafRef.current = requestAnimationFrame(animate);
    } else {
      velocityRef.current = { x: 0, y: 0 };
    }
  }, [updateTransform, updateVisibleTiles]);

  const stopAutoPan = useCallback(() => {
    if (autoPanTimerRef.current) {
      clearTimeout(autoPanTimerRef.current);
      autoPanTimerRef.current = null;
    }
    if (autoPanRafRef.current) {
      cancelAnimationFrame(autoPanRafRef.current);
      autoPanRafRef.current = null;
    }
    isAutoPanningRef.current = false;
    setActiveCardId(null);
  }, []);

  const panToNextTestimonial = useCallback(() => {
    if (isDraggingRef.current || isAutoPanningRef.current) return;
    const container = containerRef.current;
    if (!container || focusPositionsRef.current.length === 0) return;
    const { width, height } = container.getBoundingClientRect();
    focusIndexRef.current = (focusIndexRef.current + 1) % focusPositionsRef.current.length;
    const target = focusPositionsRef.current[focusIndexRef.current];
    const targetX = target.x - width / 2;
    const targetY = target.y - height / 2 + 240;
    const startX = offsetRef.current.x;
    const startY = offsetRef.current.y;
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const startTime = performance.now();
    isAutoPanningRef.current = true;
    const tick = (now: number) => {
      if (isDraggingRef.current) {
        isAutoPanningRef.current = false;
        setActiveCardId(null);
        return;
      }
      const progress = Math.min((now - startTime) / autoPanDuration, 1);
      const eased = easeOutCubic(progress);
      offsetRef.current.x = startX + deltaX * eased;
      offsetRef.current.y = startY + deltaY * eased;
      updateTransform();
      updateVisibleTiles();
      if (progress < 1) {
        autoPanRafRef.current = requestAnimationFrame(tick);
      } else {
        isAutoPanningRef.current = false;
        setActiveCardId(target.cardId);
        if (!isDraggingRef.current) {
          autoPanTimerRef.current = setTimeout(panToNextTestimonial, autoPanInterval);
        }
      }
    };
    autoPanRafRef.current = requestAnimationFrame(tick);
  }, [updateTransform, updateVisibleTiles]);

  const startAutoPan = useCallback(() => {
    if (autoPanTimerRef.current) clearTimeout(autoPanTimerRef.current);
    autoPanTimerRef.current = setTimeout(panToNextTestimonial, autoPanInterval);
  }, [panToNextTestimonial]);

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      setIsDragging(true);
      lastPosRef.current = { x: clientX, y: clientY };
      lastTimeRef.current = Date.now();
      velocityRef.current = { x: 0, y: 0 };
      stopAutoPan();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [stopAutoPan],
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;
      const dx = clientX - lastPosRef.current.x;
      const dy = clientY - lastPosRef.current.y;
      const dt = Date.now() - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current.x = (dx / dt) * 16;
        velocityRef.current.y = (dy / dt) * 16;
      }
      offsetRef.current.x -= dx;
      offsetRef.current.y -= dy;
      lastPosRef.current = { x: clientX, y: clientY };
      lastTimeRef.current = Date.now();
      updateTransform();
      updateVisibleTiles();
    },
    [updateTransform, updateVisibleTiles],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    rafRef.current = requestAnimationFrame(animate);
    startAutoPan();
  }, [animate, startAutoPan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    offsetRef.current = { x: -width / 2, y: -height / 2 };
    focusPositionsRef.current = generateFocusPositions(
      16,
      tileSize,
      TESTIMONIALS,
      cardsPerTile,
      exclusionWidth,
      exclusionHeight,
    );
    updateVisibleTiles();
    updateTransform();
    const initial = setTimeout(() => startAutoPan(), autoPanInterval);
    return () => {
      clearTimeout(initial);
      stopAutoPan();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startAutoPan, stopAutoPan, updateTransform, updateVisibleTiles]);

  useEffect(() => {
    const onResize = () => updateVisibleTiles();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateVisibleTiles]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative isolate h-[100dvh] w-full overflow-hidden bg-transparent",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      onMouseDown={(event) => handlePointerDown(event.clientX, event.clientY)}
      onMouseMove={(event) => handlePointerMove(event.clientX, event.clientY)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (touch) handlePointerDown(touch.clientX, touch.clientY);
      }}
      onTouchMove={(event) => {
        if (!isDraggingRef.current) return;
        event.preventDefault();
        const touch = event.touches[0];
        if (touch) handlePointerMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={handlePointerUp}
    >
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,color-mix(in_srgb,var(--fg)_10%,transparent)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div ref={contentRef} className="absolute will-change-transform">
        {visibleTiles.map((tile) => (
          <div
            key={`${tile.tileX}-${tile.tileY}`}
            className="absolute"
            style={{
              left: tile.tileX * tileSize,
              top: tile.tileY * tileSize,
              width: tileSize,
              height: tileSize,
            }}
          >
            {tile.cards.map((card) => {
              const isActive = activeCardId === card.id;
              const dim = activeCardId !== null;
              return (
                <motion.article
                  key={card.id}
                  className="liquid-glass absolute overflow-hidden rounded-card p-5"
                  style={{ left: card.x, top: card.y, width: card.width }}
                  initial={false}
                  animate={{ scale: isActive ? 1.08 : 1, opacity: dim ? (isActive ? 1 : 0.14) : 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 32 }}
                >
                  <p className="text-body font-semibold tracking-tight">&ldquo;{card.testimonial.title}&rdquo;</p>
                  <p className="mt-2 text-caption text-muted">{card.testimonial.quote}</p>
                  <div className="mt-4 flex min-w-0 items-center gap-3">
                    <Avatar initials={card.testimonial.initials} />
                    <div className="min-w-0">
                      <p className="truncate text-caption font-medium">{card.testimonial.name}</p>
                      <p className="truncate text-caption text-muted">{card.testimonial.role}</p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ))}
      </div>
      {children ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
