/**
 * Display formatting.
 *
 * These stayed in the frontend when the rest of `lib/catalog.ts` moved to the
 * API, because they are locale rendering rather than data: how a date reads
 * depends on who is looking at it, not on what the archive recorded.
 */
import type { ImageRecord } from "./types";

export const formatDate = (value: string, withTime = false) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" } : {}),
  }).format(new Date(value));

/**
 * The reader-facing name of a capture sequence: "seq-007" -> "07".
 *
 * sequenceId is a filter token and a URL segment - it does not belong in a
 * heading or a sentence, so every human-facing string is built from this
 * instead. Two digits minimum, more once the archive passes ninety-nine.
 */
export const sequenceLabel = (sequenceId: string) => {
  const match = /(\d{3})$/.exec(sequenceId);
  return match ? String(Number(match[1])).padStart(2, "0") : sequenceId;
};

/** How a frame is labelled in listings when there is no capture timestamp yet. */
export const frameLabel = (image: ImageRecord) =>
  `Sequence ${sequenceLabel(image.sequenceId)} · frame ${image.frameIndex.toLocaleString()}`;

export const recordTimestamp = (image: ImageRecord) =>
  image.capturedAt ? formatDate(image.capturedAt, true) : frameLabel(image);

/** The title to show for a sequence before any site name has been supplied. */
export const collectionTitle = (
  slug: string,
  collections: { slug: string; shortTitle: string }[],
) => collections.find((collection) => collection.slug === slug)?.shortTitle ?? slug;
