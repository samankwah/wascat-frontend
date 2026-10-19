"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { nearestSlide } from "@/lib/carousel";
import { MOMENT } from "@/lib/format";
import type { GroundView } from "@/lib/ground-views";

/**
 * Per placement: how wide a photograph is, so the next one always shows, and
 * how far the track runs past its container. The photographs run out to the
 * card's edge, and to the screen's on a phone, so the peek is cut by an edge
 * rather than by white padding; `inset` keeps the first photograph and the
 * controls in line with the text around them.
 */
const VARIANTS = {
  card: {
    slide: "w-[74%] sm:w-[42%] lg:w-[46%] aspect-[4/5]",
    sizes: "(max-width: 640px) 74vw, (max-width: 1024px) 42vw, 330px",
    bleed: "-mx-5 sm:-mx-8 lg:mx-0 lg:-mr-10",
    inset: "px-5 scroll-px-5 sm:px-8 sm:scroll-px-8 lg:pl-0 lg:scroll-pl-0 lg:pr-10",
  },
  page: {
    slide: "w-[78%] sm:w-[44%] lg:w-[30%] aspect-[3/4]",
    sizes: "(max-width: 640px) 78vw, (max-width: 1024px) 44vw, 380px",
    // .container-shell leaves 14px either side below md.
    bleed: "-mx-[14px] md:mx-0",
    inset: "px-[14px] scroll-px-[14px] md:px-0 md:scroll-px-0",
  },
} as const;

/**
 * The station's ground photographs, one swipe apart.
 *
 * A native scroll-snap track, so touch, trackpad and the scrollbar-less
 * mouse wheel all move it the way the platform already does; the buttons and
 * arrow keys step one photograph at a time. Never moves on its own. The next
 * photograph peeks in from the edge, which is what tells people it scrolls.
 *
 * Portrait photographs stay portrait: cropping them to a landscape box threw
 * most of the sky away and kept the window frame some were taken through.
 */
export function GroundViewCarousel({
  views,
  place,
  variant = "card",
  eager = false,
}: {
  views: readonly GroundView[];
  /** Where the photographs were taken, for each one's alternative text. */
  place: string;
  variant?: keyof typeof VARIANTS;
  /** Load the first photograph straight away; for a carousel that is the page's main image. */
  eager?: boolean;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const total = views.length;

  const style = VARIANTS[variant];

  // Where each slide starts, measured from the first, which is where the
  // track rests at scrollLeft 0 whatever padding sits before it.
  const offsets = useCallback(() => {
    const element = track.current;
    if (!element || element.children.length === 0) return [];
    const first = element.children[0].getBoundingClientRect().left;
    return Array.from(element.children, (child) => child.getBoundingClientRect().left - first);
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setCurrent(nearestSlide(element.scrollLeft, offsets(), element.scrollWidth - element.clientWidth)),
      );
    };
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [offsets]);

  const go = (index: number) => {
    const element = track.current;
    if (!element) return;
    const target = Math.max(0, Math.min(total - 1, index));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: offsets()[target] ?? 0, behavior: reduce ? "auto" : "smooth" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const step = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: total - 1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    go(step);
  };

  if (total === 0) return null;

  const atStart = current === 0;
  const atEnd = current === total - 1;

  return (
    <div role="region" aria-roledescription="carousel" aria-label={`Ground photographs of the sky at ${place}`} className={`min-w-0 ${style.bleed}`}>
      <ul
        ref={track}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Photographs. Use the arrow keys to move between them."
        className={`${style.inset} flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden`}
      >
        {views.map((view, index) => {
          const when = view.capturedAt ? `${MOMENT.format(new Date(view.capturedAt))} UTC` : undefined;
          return (
            <li
              key={view.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${total}`}
              className={`${style.slide} relative shrink-0 snap-start overflow-hidden rounded-lg bg-ink-abyss`}
            >
              <Image
                src={view.src}
                alt={`The sky over ${place}${when ? ` at ${when}` : ""}, photographed from the ground.`}
                fill
                sizes={style.sizes}
                loading={eager && index === 0 ? "eager" : "lazy"}
                fetchPriority={eager && index === 0 ? "high" : "auto"}
                className="object-cover object-[center_22%]"
                draggable={false}
              />
              {when ? (
                <span className="absolute bottom-2.5 left-2.5 rounded-full bg-ink-abyss/75 px-2.5 py-1 font-mono text-[.68rem] text-white backdrop-blur-sm">
                  {when}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {total > 1 ? (
        <div className={`${style.inset} mt-4 flex items-center justify-between gap-4`}>
          <p className="tabular font-mono text-xs text-muted" aria-live="polite" aria-atomic="true">
            <span className="text-ink">{current + 1}</span>
            <span aria-hidden="true"> / </span>
            <span className="sr-only"> of </span>
            {total}
          </p>
          <div className="flex gap-2">
            <ArrowButton label="Previous photograph" disabled={atStart} onClick={() => go(current - 1)}>
              <ChevronLeft size={18} aria-hidden="true" />
            </ArrowButton>
            <ArrowButton label="Next photograph" disabled={atEnd} onClick={() => go(current + 1)}>
              <ChevronRight size={18} aria-hidden="true" />
            </ArrowButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-sky hover:text-sky disabled:cursor-default disabled:border-line disabled:text-line-strong motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}
