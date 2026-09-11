/**
 * Reading the archive.
 *
 * Replaces the module-level constants `lib/catalog.ts` used to export from a
 * bundled 2.7 MB JSON file. Everything is a request now, which is what lets a
 * curator publish a correction without a deploy.
 *
 * Server components call these directly. Each response is tagged so a
 * mutation in the dashboard can invalidate exactly the pages it affects
 * through `/api/revalidate`, rather than everything on a timer.
 */
import "server-only";

import type {
  Collection,
  CollectionSummary,
  Facets,
  ImagePage,
  ImageRecord,
  Release,
} from "./types";

/**
 * Server-side requests go straight to the API.
 *
 * The browser reaches it through a rewrite on this app's own origin (see
 * next.config.ts), which keeps every documented `/api/v1/...` URL working and
 * keeps admin cookies same-origin. A server component has no reason to take
 * that detour, and taking it during a build would mean the site could not
 * render without its own server already listening.
 */
const API_ORIGIN = process.env.WASCAT_API_ORIGIN ?? "http://127.0.0.1:8000";

/** How long a cached response may be reused before it is checked again. */
const REVALIDATE_SECONDS = 300;

export const TAGS = {
  images: "images",
  collections: "collections",
  facets: "facets",
  collection: (slug: string) => `collection:${slug}`,
  image: (id: string) => `image:${id}`,
} as const;

type Envelope<T> = {
  data: T;
  meta: Record<string, unknown> & { apiVersion: string; generatedAt: string };
  links: Record<string, string | null>;
};

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(
  path: string,
  { tags, revalidate = REVALIDATE_SECONDS }: { tags: string[]; revalidate?: number | false },
): Promise<Envelope<T> | null> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate, tags },
  });

  // A missing record is an ordinary outcome the caller renders as a 404, not
  // an exception.
  if (response.status === 404) return null;

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the status line.
    }
    throw new ApiRequestError(response.status, path, message);
  }

  return (await response.json()) as Envelope<T>;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query.size ? `?${query.toString()}` : "";
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export type ImageQueryParams = Record<string, string | number | undefined>;

export async function getImages(params: ImageQueryParams = {}): Promise<ImagePage> {
  const envelope = await request<ImageRecord[]>(`/api/v1/images${queryString(params)}`, {
    tags: [TAGS.images],
  });
  if (!envelope) return { records: [], total: 0, limit: 0, nextCursor: null };
  return {
    records: envelope.data,
    total: Number(envelope.meta.total ?? envelope.data.length),
    limit: Number(envelope.meta.limit ?? envelope.data.length),
    nextCursor: (envelope.meta.nextCursor as string | null) ?? null,
  };
}

export async function getImage(id: string): Promise<ImageRecord | null> {
  const envelope = await request<ImageRecord>(`/api/v1/images/${encodeURIComponent(id)}`, {
    tags: [TAGS.images, TAGS.image(id)],
  });
  return envelope?.data ?? null;
}

/** Frames from one sequence, for the sample grids and adjacent-frame strips. */
export async function getCollectionImages(
  slug: string,
  params: ImageQueryParams = {},
): Promise<ImageRecord[]> {
  const page = await getImages({ collection: slug, ...params });
  return page.records;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export async function getCollections(): Promise<CollectionSummary[]> {
  const envelope = await request<CollectionSummary[]>("/api/v1/collections", {
    tags: [TAGS.collections],
  });
  return envelope?.data ?? [];
}

export async function getCollection(slug: string): Promise<Collection | null> {
  const envelope = await request<Collection>(
    `/api/v1/collections/${encodeURIComponent(slug)}`,
    { tags: [TAGS.collections, TAGS.collection(slug)] },
  );
  return envelope?.data ?? null;
}

export async function getReleases(slug: string): Promise<Release[]> {
  const envelope = await request<Release[]>(
    `/api/v1/collections/${encodeURIComponent(slug)}/releases`,
    { tags: [TAGS.collections, TAGS.collection(slug)] },
  );
  return envelope?.data ?? [];
}

// ---------------------------------------------------------------------------
// Facets and archive-wide totals
// ---------------------------------------------------------------------------

export async function getFacets(): Promise<Facets> {
  const envelope = await request<Facets>("/api/v1/facets", { tags: [TAGS.facets] });
  return (
    envelope?.data ?? {
      collections: [],
      sequences: [],
      cloudCoverOktas: [],
      segmentation: [],
      artifacts: [],
      seasons: [],
      timesOfDay: [],
      skyClasses: [],
      locations: [],
    }
  );
}

export type ArchiveStats = {
  /** Every frame in the published archive. */
  total: number;
  /** Frames carrying a mask, and therefore a measured cloud cover. */
  segmented: number;
  /** Frames nobody has segmented yet, which report no cover at all. */
  unsegmented: number;
  collections: number;
  sequences: string[];
  /** Whether any frame carries a capture timestamp yet. */
  hasTimestamps: boolean;
};

export async function getArchiveStats(): Promise<ArchiveStats> {
  const facets = await getFacets();
  const count = (values: { value: string | number; count: number }[], value: string) =>
    values.find((entry) => entry.value === value)?.count ?? 0;

  const segmented = count(facets.segmentation, "segmented");
  const unsegmented = count(facets.segmentation, "unsegmented");

  return {
    total: segmented + unsegmented,
    segmented,
    unsegmented,
    collections: facets.collections.length,
    sequences: facets.sequences.map((entry) => String(entry.value)),
    hasTimestamps: await hasTimestampedFrames(),
  };
}

/**
 * Does any frame carry a capture time?
 *
 * Asked by filtering from a date older than any possible capture. A date
 * filter excludes frames that have no timestamp, so the total it reports *is*
 * the number of timestamped frames - no extra endpoint needed, and the query
 * rides the partial index that exists for exactly this predicate.
 *
 * It is zero today, because per-sequence provenance has not been supplied. The
 * date filters appear in Explore the moment a curator sets a capture time.
 */
async function hasTimestampedFrames(): Promise<boolean> {
  const page = await getImages({ from: "1970-01-01", limit: 1 });
  return page.total > 0;
}
