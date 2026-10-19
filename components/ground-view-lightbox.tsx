"use client";

import Image from "next/image";
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { MOMENT } from "@/lib/format";
import type { GroundView } from "@/lib/ground-views";

/** How far a swipe has to travel, in CSS pixels, before it counts. */
const SWIPE_PX = 50;

/**
 * One ground photograph at full size, with the ones either side a key, a
 * swipe or a button away.
 *
 * A native modal <dialog>: the browser makes the page behind it inert, keeps
 * focus inside, closes it on Escape and returns focus to whatever opened it,
 * so none of that is reimplemented here. What is added: the arrow keys and a
 * horizontal swipe step between photographs, the page underneath stops
 * scrolling, and the photographs either side are fetched in advance so
 * stepping never waits.
 */
export function GroundViewLightbox({
  views,
  index,
  place,
  onChange,
  onClose,
}: {
  views: readonly GroundView[];
  /** The photograph showing, or null when closed. */
  index: number | null;
  place: string;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const swipe = useRef<number | null>(null);
  const total = views.length;
  const open = index !== null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  // The page behind should not scroll under a full-screen photograph.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [open]);

  if (index === null) return <dialog ref={dialog} aria-label="Photograph" className="hidden" onClose={onClose} />;

  const view = views[index];
  const when = view.capturedAt ? `${MOMENT.format(new Date(view.capturedAt))} UTC` : undefined;
  const step = (by: number) => {
    const next = index + by;
    if (next >= 0 && next < total) onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft") step(-1);
    else if (event.key === "ArrowRight") step(1);
    else return;
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipe.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (swipe.current === null) return;
    const distance = event.clientX - swipe.current;
    swipe.current = null;
    if (Math.abs(distance) >= SWIPE_PX) step(distance < 0 ? 1 : -1);
  };

  const neighbours = [views[index - 1], views[index + 1]].filter(Boolean);

  return (
    <dialog
      ref={dialog}
      aria-label={`Photograph ${index + 1} of ${total}: ${view.clouds.join(" and ")} over ${place}`}
      onClose={onClose}
      onKeyDown={onKeyDown}
      className="fixed inset-0 m-0 hidden h-dvh max-h-none w-screen max-w-none flex-col bg-ink-abyss p-0 text-white backdrop:bg-ink-abyss open:flex"
    >
      <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="tabular font-mono text-sm text-white/80">
          <span className="text-white">{index + 1}</span> / {total}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          autoFocus
          className="grid size-11 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white motion-reduce:transition-none"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </header>

      <div
        className="relative min-h-0 flex-1 touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipe.current = null;
        }}
      >
        <Image
          key={view.src}
          src={view.src}
          alt={`${view.clouds.join(" and ")} over ${place}${when ? ` at ${when}` : ""}, photographed from the ground.`}
          fill
          sizes="100vw"
          loading="eager"
          className="object-contain"
          draggable={false}
        />
        {/* Fetched now so the next step is instant; never shown. */}
        {neighbours.map((neighbour) => (
          <Image key={neighbour.src} src={neighbour.src} alt="" fill sizes="100vw" loading="eager" className="invisible" aria-hidden="true" />
        ))}

        <StepButton side="left" label="Previous photograph" disabled={index === 0} onClick={() => step(-1)}>
          <ChevronLeft size={24} aria-hidden="true" />
        </StepButton>
        <StepButton side="right" label="Next photograph" disabled={index === total - 1} onClick={() => step(1)}>
          <ChevronRight size={24} aria-hidden="true" />
        </StepButton>
      </div>

      <footer className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pb-5 pt-4 sm:px-6">
        <div>
          <p className="text-lg font-semibold">{view.clouds.join(" · ")}</p>
          <p className="mt-1 text-sm text-white/70">
            {place}
            {when ? <span className="font-mono text-xs"> · {when}</span> : null}
          </p>
        </div>
        <a
          href={view.src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white"
        >
          Original file
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </footer>
    </dialog>
  );
}

function StepButton({
  side,
  label,
  disabled,
  onClick,
  children,
}: {
  side: "left" | "right";
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
      onPointerDown={(event) => event.stopPropagation()}
      className={`absolute top-1/2 ${side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"} grid size-12 -translate-y-1/2 place-items-center rounded-full bg-ink-abyss/60 text-white ring-1 ring-white/20 backdrop-blur-sm transition-opacity hover:bg-ink-abyss/80 disabled:pointer-events-none disabled:opacity-0 motion-reduce:transition-none`}
    >
      {children}
    </button>
  );
}
