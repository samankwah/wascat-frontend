"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type WheelEvent } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { nearestSlide } from "@/lib/carousel";
import { MOMENT } from "@/lib/format";
import { groundViewId, type GroundView } from "@/lib/ground-views";

/** How long each photograph stays before the next, when the carousel plays. */
const INTERVAL_MS = 5000;

/** How long the slideshow waits after someone moves it by hand before it carries on. */
const RESUME_AFTER_MS = 8000;

/**
 * The station's ground photographs on the home page, each captioned with the
 * clouds in it and each a link to its own page under `linkTo`.
 *
 * A native scroll-snap track, so touch, trackpad and wheel move it the way
 * the platform already does; the buttons and arrow keys step one photograph
 * at a time. The next photograph peeks in from the edge, which is what tells
 * people it scrolls. Portrait photographs stay portrait. The photographs run
 * out to the card's edge, and to the screen's on a phone, so the peek is cut
 * by an edge rather than by white padding.
 *
 * It plays on its own and keeps playing: a visible pause button stops it, as
 * WCAG 2.2.2 requires. Swiping or stepping by hand pauses it for a few
 * seconds rather than for good. It holds while it is off screen and while
 * the tab is hidden, and never starts for anyone who has asked for reduced
 * motion. While it plays, the counter is not announced.
 */
export function GroundViewCarousel({
  views,
  place,
  linkTo,
}: {
  views: readonly GroundView[];
  /** Where the photographs were taken, for each one's alternative text. */
  place: string;
  /** Each photograph links to `${linkTo}/${its id}`. */
  linkTo: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const total = views.length;
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  // Bumped by every hand-made move; the slideshow rests until RESUME_AFTER_MS after the last.
  const [touched, setTouched] = useState(0);
  const [resting, setResting] = useState(false);

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

  // A hand-made move rests the slideshow, then lets it carry on.
  useEffect(() => {
    if (touched === 0) return;
    const timer = window.setTimeout(() => setResting(false), RESUME_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [touched]);

  const running = playing && !resting && inView && pageVisible && total > 1;

  // One photograph per interval; the clock restarts whenever the photograph changes.
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (current >= total - 1) go(0, true);
      else go(current + 1);
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [running, current, total, go]);

  // Anything someone does to move it themselves rests the slideshow.
  const rest = () => {
    setResting(true);
    setTouched((count) => count + 1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const step = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: total - 1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    rest();
    go(step);
  };

  // A vertical wheel is the page scrolling past; only a sideways one is aimed at the photographs.
  const onWheel = (event: WheelEvent<HTMLUListElement>) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) rest();
  };

  if (total === 0) return null;

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label={`Ground photographs of the sky at ${place}`}
      className="-mx-5 min-w-0 sm:-mx-8 lg:mx-0 lg:-mr-10"
    >
      <ul
        ref={track}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={rest}
        onWheel={onWheel}
        aria-label="Photographs. Use the arrow keys to move between them."
        className="flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 [scrollbar-width:none] sm:scroll-px-8 sm:gap-4 sm:px-8 lg:scroll-pl-0 lg:pl-0 lg:pr-10 [&::-webkit-scrollbar]:hidden"
      >
        {views.map((view, index) => {
          const when = view.capturedAt ? `${MOMENT.format(new Date(view.capturedAt))} UTC` : undefined;
          return (
            <li
              key={view.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${total}`}
              className="relative aspect-[4/5] w-[74%] shrink-0 snap-start overflow-hidden rounded-lg bg-ink-abyss sm:w-[42%] lg:w-[46%]"
            >
              <Link
                href={`${linkTo}/${groundViewId(view)}`}
                aria-label={`${view.clouds.join(" and ")}, photograph ${index + 1} of ${total}`}
                className="absolute inset-0 block focus-visible:outline-offset-[-3px]"
              >
                <Image
                  src={view.src}
                  alt={`${view.clouds.join(" and ")} over ${place}${when ? ` at ${when}` : ""}, photographed from the ground.`}
                  fill
                  sizes="(max-width: 640px) 74vw, (max-width: 1024px) 42vw, 330px"
                  className="object-cover object-[center_22%]"
                  draggable={false}
                />
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-abyss/70 to-transparent px-3 pb-3 pt-10">
                  <span className="block text-sm font-semibold text-white">{view.clouds.join(" · ")}</span>
                  {when ? <span className="mt-0.5 block font-mono text-[.68rem] text-white/80">{when}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {total > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-4 px-5 sm:px-8 lg:pl-0 lg:pr-10">
          <div className="flex items-center gap-3">
            <ControlButton label={playing ? "Pause slideshow" : "Play slideshow"} onClick={() => setPlaying((value) => !value)}>
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
                rest();
                go(current - 1);
              }}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </ControlButton>
            <ControlButton
              label="Next photograph"
              disabled={current === total - 1}
              onClick={() => {
                rest();
                go(current + 1);
              }}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </ControlButton>
          </div>
        </div>
      ) : null}
    </div>
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
