"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type WheelEvent } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { GroundViewLightbox } from "@/components/ground-view-lightbox";
import { nearestSlide } from "@/lib/carousel";
import { MOMENT } from "@/lib/format";
import type { GroundView } from "@/lib/ground-views";

/** How long each photograph stays before the next, when the carousel plays. */
const INTERVAL_MS = 5000;

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
 * The station's ground photographs, each captioned with the clouds in it.
 *
 * A native scroll-snap track, so touch, trackpad and wheel move it the way
 * the platform already does; the buttons and arrow keys step one photograph
 * at a time. The next photograph peeks in from the edge, which is what tells
 * people it scrolls. Portrait photographs stay portrait.
 *
 * It plays on its own, following the WAI-ARIA carousel pattern: a visible
 * pause button; held while the pointer or keyboard focus is on it, while it
 * is off screen and while the tab is hidden; stopped for good once someone
 * swipes, steps or presses pause; and never started for anyone who has asked
 * for reduced motion. While it plays, the counter is not announced.
 *
 * Choosing a photograph opens it full size. Where the carousel is a preview
 * (`linkTo`), that happens on the full page instead: the photograph links
 * there with ?photo=N, and the page opens on it. On the full page the address
 * follows the photograph showing, so it can be shared.
 */
export function GroundViewCarousel({
  views,
  place,
  variant = "card",
  eager = false,
  linkTo,
  initialPhoto,
}: {
  views: readonly GroundView[];
  /** Where the photographs were taken, for each one's alternative text. */
  place: string;
  variant?: keyof typeof VARIANTS;
  /** Load the first photograph straight away; for a carousel that is the page's main image. */
  eager?: boolean;
  /** Open photographs on this page rather than here. */
  linkTo?: string;
  /** A 1-based photograph to open on arrival, from ?photo=N. */
  initialPhoto?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const total = views.length;
  // Arriving from a preview with ?photo=N opens on that photograph, still.
  const arrival = initialPhoto && initialPhoto >= 1 && initialPhoto <= total ? initialPhoto - 1 : null;
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(arrival === null);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [viewing, setViewing] = useState<number | null>(arrival);
  const style = VARIANTS[variant];

  // Where each slide starts, measured from the first, which is where the
  // track rests at scrollLeft 0 whatever padding sits before it.
  const offsets = useCallback(() => {
    const element = track.current;
    if (!element || element.children.length === 0) return [];
    const first = element.children[0].getBoundingClientRect().left;
    return Array.from(element.children, (child) => child.getBoundingClientRect().left - first);
  }, []);

  const go = useCallback(
    (index: number, instant = false) => {
      const element = track.current;
      if (!element) return;
      const target = Math.max(0, Math.min(total - 1, index));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollTo({ left: offsets()[target] ?? 0, behavior: instant || reduce ? "auto" : "smooth" });
    },
    [offsets, total],
  );

  // Which photograph is showing, however the track got there.
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

  // Reduced motion means no autoplay at all, including if it is turned on later.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (query.matches) setPlaying(false);
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  // Only play where someone can see it.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(element);
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // The address follows the open photograph, so it can be shared or reloaded.
  const syncAddress = (index: number | null) => {
    const url = new URL(window.location.href);
    if (index === null) url.searchParams.delete("photo");
    else url.searchParams.set("photo", String(index + 1));
    window.history.replaceState(window.history.state, "", url);
  };

  const openPhoto = (index: number) => {
    setPlaying(false);
    setViewing(index);
    syncAddress(index);
  };

  // ...and lines the carousel up behind it, for when it closes.
  useEffect(() => {
    if (arrival !== null) go(arrival, true);
  }, [arrival, go]);

  const running = playing && !held && inView && pageVisible && viewing === null && total > 1;

  // One photograph per interval; the clock restarts whenever the photograph changes.
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (current >= total - 1) go(0, true);
      else go(current + 1);
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [running, current, total, go]);

  // Anything someone does to move it themselves ends the slideshow.
  const stop = () => setPlaying(false);

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const step = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: total - 1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    stop();
    go(step);
  };

  // A vertical wheel is the page scrolling past; only a sideways one is aimed at the photographs.
  const onWheel = (event: WheelEvent<HTMLUListElement>) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) stop();
  };

  if (total === 0) return null;

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label={`Ground photographs of the sky at ${place}`}
      className={`min-w-0 ${style.bleed}`}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
      }}
    >
      <ul
        ref={track}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={stop}
        onWheel={onWheel}
        aria-label="Photographs. Use the arrow keys to move between them."
        className={`${style.inset} flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden`}
      >
        {views.map((view, index) => {
          const when = view.capturedAt ? `${MOMENT.format(new Date(view.capturedAt))} UTC` : undefined;
          const clouds = view.clouds.join(" · ");
          return (
            <li
              key={view.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${total}`}
              className={`${style.slide} relative shrink-0 snap-start overflow-hidden rounded-lg bg-ink-abyss`}
            >
              <Slide
                href={linkTo ? `${linkTo}?photo=${index + 1}` : undefined}
                onOpen={() => openPhoto(index)}
                label={`Open photograph ${index + 1}: ${view.clouds.join(" and ")}`}
              >
                <Image
                  src={view.src}
                  alt={`${view.clouds.join(" and ")} over ${place}${when ? ` at ${when}` : ""}, photographed from the ground.`}
                  fill
                  sizes={style.sizes}
                  loading={eager && index === 0 ? "eager" : "lazy"}
                  fetchPriority={eager && index === 0 ? "high" : "auto"}
                  className="object-cover object-[center_22%]"
                  draggable={false}
                />
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-abyss/70 to-transparent px-3 pb-3 pt-10 text-left">
                  <p className="text-sm font-semibold text-white">{clouds}</p>
                  {when ? <p className="mt-0.5 font-mono text-[.68rem] text-white/80">{when}</p> : null}
                </div>
              </Slide>
            </li>
          );
        })}
      </ul>

      {total > 1 ? (
        <div className={`${style.inset} mt-4 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <ControlButton
              label={playing ? "Pause slideshow" : "Play slideshow"}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" className="translate-x-px" />}
            </ControlButton>
            <p className="tabular font-mono text-xs text-muted" aria-live={running ? "off" : "polite"} aria-atomic="true">
              <span className="text-ink">{current + 1}</span>
              <span aria-hidden="true"> / </span>
              <span className="sr-only"> of </span>
              {total}
            </p>
          </div>
          <div className="flex gap-2">
            <ControlButton
              label="Previous photograph"
              disabled={current === 0}
              onClick={() => {
                stop();
                go(current - 1);
              }}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </ControlButton>
            <ControlButton
              label="Next photograph"
              disabled={current === total - 1}
              onClick={() => {
                stop();
                go(current + 1);
              }}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </ControlButton>
          </div>
        </div>
      ) : null}

      {linkTo ? null : (
        <GroundViewLightbox
          views={views}
          index={viewing}
          place={place}
          onChange={(index) => {
            setViewing(index);
            syncAddress(index);
          }}
          onClose={() => {
            if (viewing !== null) go(viewing, true);
            setViewing(null);
            syncAddress(null);
          }}
        />
      )}
    </div>
  );
}

/** The whole photograph is the target: a link to the full page, or a button that opens it here. */
function Slide({
  href,
  onOpen,
  label,
  children,
}: {
  href?: string;
  onOpen: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const className = "absolute inset-0 block cursor-pointer focus-visible:outline-offset-[-3px]";
  return href ? (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} aria-label={label} className={className}>
      {children}
    </button>
  );
}

function ControlButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
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
