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

/** How a frame is labelled in listings when there is no capture timestamp yet. */
export const frameLabel = (image: ImageRecord) =>
  `${image.videoId} · frame ${image.frameIndex.toLocaleString()}`;

export const recordTimestamp = (image: ImageRecord) =>
  image.capturedAt ? formatDate(image.capturedAt, true) : frameLabel(image);

/** The title to show for a sequence before any site name has been supplied. */
export const collectionTitle = (
  slug: string,
  collections: { slug: string; shortTitle: string }[],
) => collections.find((collection) => collection.slug === slug)?.shortTitle ?? slug;
