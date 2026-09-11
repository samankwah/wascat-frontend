/**
 * A stand-in for the catalogue API.
 *
 * The frontend no longer holds the archive, so its tests no longer assert
 * counts. What they can still check is everything the frontend is now
 * responsible for: building the right request from a URL, reading the
 * envelope, turning a 404 into a missing record rather than an exception, and
 * rendering a frame according to what it actually holds.
 *
 * The dataset below is deliberately tiny and deliberately awkward - a paired
 * frame, a mask with no source, and an unsegmented frame - because those three
 * shapes are where the "omit, never invent" rule is either honoured or broken.
 */
import { vi } from "vitest";

import type { Collection, CollectionSummary, Facets, ImageRecord } from "@/lib/types";

export const PAIRED: ImageRecord = {
  id: "WAS-V01-F5",
  collection: "seq-001",
  release: "1.0",
  sequenceId: "seq-001",
  frameIndex: 5,
  cloudFraction: 0.525588,
  cloudCoverOktas: 4,
  maskScale: 1,
  width: 640,
  height: 360,
  image: "/frames/seq-001/5-source.jpg",
  sourceUrl: "/frames/seq-001/5-source.jpg",
  maskUrl: "/frames/seq-001/5-mask.jpg",
  hasSource: true,
  hasMask: true,
  alt: "All-sky camera frame 5 of sequence 01, measured at 4/8 cloud cover.",
  tags: ["seq-001", "4/8", "source + mask"],
  artifacts: [
    {
      type: "source",
      url: "/frames/seq-001/5-source.jpg",
      objectKey: "frames/seq-001/5-source.jpg",
      bytes: 23133,
      checksum: "f".repeat(64),
      mediaType: "image/jpeg",
    },
    {
      type: "mask",
      url: "/frames/seq-001/5-mask.jpg",
      objectKey: "frames/seq-001/5-mask.jpg",
      bytes: 21265,
      checksum: "a".repeat(64),
      mediaType: "image/jpeg",
    },
  ],
  sortKey: "001-0000005",
};

export const MASK_ONLY: ImageRecord = {
  ...PAIRED,
  id: "WAS-V05-F17",
  collection: "seq-005",
  sequenceId: "seq-005",
  frameIndex: 17,
  // Delivered larger than the frame it segments; the viewer scales it back.
  maskScale: 1.146497,
  image: "/frames/seq-005/17-mask.jpg",
  sourceUrl: undefined,
  maskUrl: "/frames/seq-005/17-mask.jpg",
  hasSource: false,
  hasMask: true,
  alt: "Binary cloud segmentation mask for frame 17 of sequence 05, measured at 4/8 cloud cover.",
  tags: ["seq-005", "4/8", "mask only"],
  artifacts: [PAIRED.artifacts[1]],
  sortKey: "005-0000017",
};

/** No mask, so no measurement: the two cover fields are absent, not zero. */
export const UNSEGMENTED: ImageRecord = {
  id: "WAS-V01-F2",
  collection: "seq-001",
  release: "1.0",
  sequenceId: "seq-001",
  frameIndex: 2,
  maskScale: 1,
  width: 640,
  height: 360,
  image: "/frames/seq-001/2-source.jpg",
  sourceUrl: "/frames/seq-001/2-source.jpg",
  hasSource: true,
  hasMask: false,
  alt: "All-sky camera frame 2 of sequence 01, not yet segmented.",
  tags: ["seq-001", "unsegmented", "source only"],
  artifacts: [PAIRED.artifacts[0]],
  sortKey: "001-0000002",
};

export const RECORDS = [PAIRED, MASK_ONLY, UNSEGMENTED];

export const COLLECTION: Collection = {
  slug: "seq-001",
  title: "Capture sequence 01",
  shortTitle: "Sequence 01",
  kicker: "ALL-SKY CLOUD SEGMENTATION · SEQUENCE 01",
  description: "323 all-sky frames from capture sequence 01.",
  coverage: "Frames 2–3,611 · 223 of 323 segmented",
  sequenceIds: ["seq-001"],
  images: 323,
  artifacts: 493,
  withSource: 270,
  segmented: 223,
  image: "/frames/seq-001/5-source.jpg",
  imageAlt: PAIRED.alt,
  releases: [{ version: "1.0", images: 323, size: "10.4 MB", current: true }],
  meanCloudCoverOktas: 4.2,
  maskRegistration: [{ sequenceId: "seq-001", scale: 1, corrected: false }],
};

export const COLLECTION_SUMMARY: CollectionSummary = {
  ...COLLECTION,
  currentRelease: COLLECTION.releases[0],
};

export const FACETS: Facets = {
  collections: [{ value: "seq-001", label: "Sequence 01", count: 323 }],
  sequences: [{ value: "seq-001", label: "Sequence 01", count: 323 }],
  cloudCoverOktas: Array.from({ length: 9 }, (_, okta) => ({
    value: okta,
    label: okta === 0 ? "0/8 · Clear" : okta === 8 ? "8/8 · Overcast" : `${okta}/8`,
    count: okta === 4 ? 223 : 0,
  })),
  segmentation: [
    { value: "segmented", label: "Has a cloud mask", count: 223 },
    { value: "unsegmented", label: "Not yet segmented", count: 100 },
  ],
  artifacts: [
    { value: "source", count: 270 },
    { value: "mask", count: 223 },
  ],
  // No provenance supplied yet, so every one of these is still zero. The
  // filter panel must not offer them.
  seasons: [
    { value: "Harmattan", count: 0 },
    { value: "Dry season", count: 0 },
    { value: "Wet season", count: 0 },
    { value: "Transition", count: 0 },
  ],
  timesOfDay: [
    { value: "Morning", count: 0 },
    { value: "Midday", count: 0 },
    { value: "Afternoon", count: 0 },
    { value: "Evening", count: 0 },
  ],
  skyClasses: [],
  locations: [],
};

function envelope(data: unknown, meta: Record<string, unknown> = {}, links: Record<string, unknown> = {}) {
  return {
    data,
    meta: { apiVersion: "1.0", generatedAt: "2026-09-03T00:00:00.000Z", ...meta },
    links: { self: "https://wascat.example.org", ...links },
  };
}

export type RequestLog = { url: string; params: URLSearchParams }[];

/**
 * Install a fetch that answers like the API.
 *
 * Returns the log of requests made, so a test can assert what the page asked
 * for as well as what it rendered - which is where the interesting bugs are
 * once filtering happens server-side.
 */
export function installApiMock(): { requests: RequestLog; restore: () => void } {
  const requests: RequestLog = [];
  const original = globalThis.fetch;

  const handler = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://127.0.0.1:8000");
    const params = url.searchParams;
    requests.push({ url: url.pathname, params });

    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });

    if (url.pathname === "/api/v1/facets") return json(envelope(FACETS));

    if (url.pathname === "/api/v1/collections") {
      return json(envelope([COLLECTION_SUMMARY], { count: 1 }));
    }

    if (url.pathname === "/api/v1/collections/seq-001") return json(envelope(COLLECTION));
    if (url.pathname === "/api/v1/collections/seq-001/releases") {
      return json(envelope(COLLECTION.releases, { collection: "seq-001", count: 1 }));
    }
    if (url.pathname.startsWith("/api/v1/collections/")) {
      return json({ error: { code: "not_found", message: "Collection not found" } }, 404);
    }

    if (url.pathname.startsWith("/api/v1/images/")) {
      const id = decodeURIComponent(url.pathname.split("/").pop()!);
      const record = RECORDS.find((item) => item.id === id);
      return record
        ? json(envelope(record))
        : json({ error: { code: "not_found", message: "Image record not found" } }, 404);
    }

    if (url.pathname === "/api/v1/images") {
      // Enough filtering to exercise the caller, not a reimplementation of
      // the API: that is tested against a real database in the backend.
      let matched = RECORDS;
      const collection = params.get("collection");
      if (collection) matched = matched.filter((item) => item.collection === collection);
      const segmented = params.get("segmented");
      if (segmented) matched = matched.filter((item) => item.hasMask === (segmented === "true"));
      // A date bound excludes frames with no capture time, and none have one.
      if (params.get("from") || params.get("to")) matched = [];

      const limit = Number(params.get("limit") ?? 24);
      const page = matched.slice(0, limit);
      return json(
        envelope(page, {
          count: page.length,
          total: matched.length,
          limit,
          nextCursor: matched.length > limit ? "next-page-cursor" : null,
        }, { next: null }),
      );
    }

    return json({ error: { code: "not_found", message: "No such endpoint" } }, 404);
  });

  globalThis.fetch = handler as unknown as typeof fetch;
  return { requests, restore: () => { globalThis.fetch = original; } };
}
