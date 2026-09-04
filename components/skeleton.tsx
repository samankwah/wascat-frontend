/**
 * Skeleton loading primitives.
 *
 * The archive renders its dynamic pages on request (see the `connection()`
 * calls throughout `app/`), so every one of them has a real, if usually
 * brief, gap between navigation and paint. A `loading.tsx` next to a page
 * fills that gap with a Suspense fallback shaped like the page itself,
 * rather than a spinner that tells you nothing about what's coming.
 *
 * These are shapes, not a design language of their own: they borrow the
 * archive's own geometry (`aspect-[16/9]` frames, `border-line` panels,
 * `eyebrow` widths) so a skeleton and the content it precedes occupy the
 * same box and nothing jumps when the swap happens.
 */
import type { CSSProperties, ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  /** Use the inverted tone for skeletons sitting on a dark (ink) panel. */
  onDark?: boolean;
};

/**
 * One skeleton shape. Give it the dimensions of what it stands in for
 * (`h-4 w-24`, `aspect-[16/9]`, `size-11 rounded-full`, ...) - this renders
 * nothing on its own but the shimmer and the resting colour.
 */
export function Skeleton({ className = "", style, onDark = false }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`skeleton block ${onDark ? "skeleton-on-dark" : ""} ${className}`}
    />
  );
}

/**
 * A paragraph's worth of skeleton lines. The last line runs short, the way a
 * real paragraph does, so a block of skeleton text doesn't read as a bar
 * chart.
 */
export function SkeletonLines({
  lines = 3,
  className = "",
  lineClassName = "h-3",
  onDark = false,
}: {
  lines?: number;
  className?: string;
  lineClassName?: string;
  onDark?: boolean;
}) {
  return (
    <div className={`grid gap-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          onDark={onDark}
          className={`${lineClassName} ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/**
 * Wraps a page's skeleton so assistive tech hears one "Loading" rather than
 * every individual shape - the shapes are decorative, this is the only part
 * a screen reader needs.
 */
export function SkeletonPage({
  children,
  label = "Loading",
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <>
      <span role="status" className="sr-only">{label}</span>
      <div aria-hidden="true" className={className}>{children}</div>
    </>
  );
}
