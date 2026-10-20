/**
 * Which slide a scroll-snap track is showing.
 *
 * The track snaps each slide's leading edge to its start, so the current
 * slide is whichever leading edge is nearest the scroll position. Reading it
 * from offsets rather than dividing by a fixed width keeps it right when the
 * last slides cannot reach the start because the track has run out.
 */
export function nearestSlide(scrollLeft: number, offsets: readonly number[], maxScroll: number): number {
  if (offsets.length === 0) return 0;
  // At the far end the last slide is current, even though its edge never
  // reaches the start.
  if (maxScroll > 0 && scrollLeft >= maxScroll - 1) return offsets.length - 1;
  let best = 0;
  for (let index = 1; index < offsets.length; index += 1) {
    if (Math.abs(offsets[index] - scrollLeft) < Math.abs(offsets[best] - scrollLeft)) best = index;
  }
  return best;
}
