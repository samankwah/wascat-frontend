"use client";

import Image from "next/image";
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { cloudTypeInfo } from "@/lib/cloud-types";
import { MOMENT } from "@/lib/format";
import type { GroundView } from "@/lib/ground-views";

/** How far a swipe has to travel, in CSS pixels, before it counts. */
const SWIPE_PX = 50;

/**
 * One ground photograph at full size, in a light panel over the page, with
 * the ones either side a key, a swipe or a button away.
 *
 * A native modal <dialog>: the browser makes the page behind it inert, keeps
 * focus inside, closes it on Escape and returns focus to whatever opened it,
 * so none of that is reimplemented here. What is added: the arrow keys and a
 * horizontal swipe step between photographs, the page underneath stops
 * scrolling, and the photographs either side are fetched in advance so
 * stepping never waits. Focus lands on the panel rather than the close
 * button, so opening it with a click does not light up a focus ring.
 */
export function GroundViewLightbox({
  views,
  index,
  place,
  placeFacts = [],
  onChange,
  onClose,
}: {
  views: readonly GroundView[];
  /** The photograph showing, or null when closed. */
  index: number | null;
  place: string;
  /** More about where the photographs were taken, as label and value: region, position. */
  placeFacts?: readonly (readonly [string, string])[];
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

  // The page behind should not scroll under the photograph.
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
  const [main, ...others] = view.clouds;
  const info = cloudTypeInfo(main);
  const facts: (readonly [string, string])[] = [
    ["Station", place],
    ...placeFacts,
    ...(when ? ([["Taken", when]] as const) : []),
    ...(view.visibilityM != null ? ([["Visibility", `${view.visibilityM.toLocaleString("en-GB")} m`]] as const) : []),
  ];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="ground-view-title"
      onClose={onClose}
      onKeyDown={onKeyDown}
      // Clicking the dimmed page around the panel closes it, as on any modal.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-0 hidden h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink/35 backdrop:backdrop-blur-[3px] open:grid open:place-items-center sm:p-6"
    >
      <div
        tabIndex={-1}
        autoFocus
        className="grid h-full w-full grid-rows-[62dvh_minmax(0,1fr)] overflow-hidden bg-white text-ink outline-none sm:h-[min(860px,calc(100dvh-3rem))] sm:max-w-6xl sm:rounded-2xl sm:shadow-[0_24px_80px_rgba(16,47,65,.28)] md:grid-cols-[minmax(0,1fr)_20rem] md:grid-rows-1"
      >
        <div
          className="relative min-h-0 touch-pan-y select-none bg-paper"
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
            sizes="(max-width: 768px) 100vw, 70vw"
            loading="eager"
            className="object-contain p-3 sm:p-5"
            draggable={false}
          />
          {/* Fetched now so the next step is instant; never shown. */}
          {neighbours.map((neighbour) => (
            <Image key={neighbour.src} src={neighbour.src} alt="" fill sizes="(max-width: 768px) 100vw, 70vw" loading="eager" className="invisible" aria-hidden="true" />
          ))}

          <StepButton side="left" label="Previous photograph" disabled={index === 0} onClick={() => step(-1)}>
            <ChevronLeft size={20} aria-hidden="true" />
          </StepButton>
          <StepButton side="right" label="Next photograph" disabled={index === total - 1} onClick={() => step(1)}>
            <ChevronRight size={20} aria-hidden="true" />
          </StepButton>

          {/* On a phone the close button sits over the photograph, where a thumb expects it. */}
          <CloseButton onClose={onClose} className="absolute right-3 top-3 grid md:hidden" />
        </div>

        <aside className="flex min-h-0 flex-col overflow-y-auto overscroll-contain border-t border-line p-5 sm:p-6 md:border-l md:border-t-0">
          <div className="flex items-center justify-between gap-4">
            <p className="tabular font-mono text-xs text-muted">
              <span className="text-ink">{index + 1}</span> / {total}
            </p>
            <CloseButton onClose={onClose} className="hidden md:grid" />
          </div>

          <p className="eyebrow mt-4 text-sky md:mt-8">Ground photograph</p>
          <h2 id="ground-view-title" className="display mt-2 text-3xl leading-tight md:text-4xl">
            {main}
          </h2>
          {info ? (
            <>
              <p className="mt-2 font-mono text-xs text-muted">
                {info.level === "Vertical" ? "Vertical development" : `${info.level} cloud`} · {info.heights}
              </p>
              <p className="mt-4 text-sm leading-6 text-muted">{info.description}</p>
              <p className="mt-3 text-sm text-ink">
                <span className="text-muted">Usually brings </span>
                {info.weather.charAt(0).toLowerCase() + info.weather.slice(1)}
              </p>
            </>
          ) : null}
          {others.length > 0 ? (
            <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-sm text-ink">
              <span className="text-muted">Also in the frame: </span>
              {others.join(", ")}
            </p>
          ) : null}

          <dl className="mt-6 border-t border-line text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 border-b border-line py-2.5">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className={`text-right text-ink ${label === "Position" ? "font-mono text-xs" : "font-semibold"}`}>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 md:mt-auto md:pt-6">
            <p className="text-xs text-muted">Cloud types identified from the photograph.</p>
            <a
              href={view.src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-sky hover:underline"
            >
              Open original
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </aside>
      </div>
    </dialog>
  );
}

function CloseButton({ onClose, className }: { onClose: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className={`${className} size-10 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:border-line-strong hover:bg-paper motion-reduce:transition-none`}
    >
      <X size={18} aria-hidden="true" />
    </button>
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
      className={`absolute top-1/2 ${side === "left" ? "left-3" : "right-3"} grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/95 text-ink shadow-[0_4px_14px_rgba(16,47,65,.12)] transition-[opacity,border-color] hover:border-line-strong disabled:pointer-events-none disabled:opacity-0 motion-reduce:transition-none`}
    >
      {children}
    </button>
  );
}
