import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ExploreShell, type ExploreOptions } from "@/components/explore-filters";
import { FrameCard } from "@/components/frame-card";
import { getCollections, getFacets, getImages } from "@/lib/api-client";
import { decodeOffsetCursor, encodeOffsetCursor, imageQuerySchema } from "@/lib/search";
import type { FacetValue } from "@/lib/types";

export const metadata: Metadata = {
  title: "Explore images",
  description: "Search all-sky cloud imagery by capture sequence, measured cloud cover, and available artifacts.",
};

const values = (facet: FacetValue[]) => facet.map((entry) => String(entry.value));
/** Only offer a filter that can actually match something. */
const populated = (facet: FacetValue[]) =>
  facet.filter((entry) => entry.count > 0).map((entry) => String(entry.value));
// `entry.value` is `string | number` - a segmentation facet's values are
// strings ("segmented"), an okta facet's are numbers (5) - so the comparison
// normalises both sides rather than assuming which.
const countOf = (facet: FacetValue[], value: string) =>
  facet.find((entry) => String(entry.value) === value)?.count ?? 0;

function pageHref(params: Record<string, string | string[] | undefined>, cursor?: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "cursor" || value === undefined) continue;
    query.set(key, Array.isArray(value) ? value[0] : value);
  }
  if (cursor) query.set("cursor", cursor);
  return `/explore${query.size ? `?${query.toString()}` : ""}`;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Render at request time rather than at build. Prerendering these would
  // make `next build` require a reachable database, coupling CI and the
  // container build to the API. The fetch data cache still applies, so this
  // costs a render and not a round trip.
  await connection();

  const params = await searchParams;
  // Unparseable filters fall back to defaults rather than failing the page.
  const parsed = imageQuerySchema.safeParse(params);
  const query = parsed.success ? parsed.data : imageQuerySchema.parse({});

  const offset = decodeOffsetCursor(query.cursor);
  const [facets, collections, page, timestamped] = await Promise.all([
    getFacets(),
    getCollections(),
    getImages({
      ...(Object.fromEntries(
        Object.entries(query).filter(
          ([key, value]) => key !== "cursor" && value !== undefined,
        ),
      ) as Record<string, string | number>),
      cursor: encodeOffsetCursor(offset),
    }),
    // A date filter excludes frames with no capture time, so the total it
    // reports is the number of frames that have one. Zero until the capture
    // team supplies provenance, at which point the date filters appear.
    getImages({ from: "1970-01-01", limit: 1 }),
  ]);

  const options: ExploreOptions = {
    collections: facets.collections.map((entry) => ({
      slug: String(entry.value),
      shortTitle: entry.label ?? String(entry.value),
    })),
    releases: [
      ...new Set(
        collections
          .map((collection) => collection.currentRelease?.version)
          .filter((version): version is string => Boolean(version)),
      ),
    ],
    sequenceIds: values(facets.sequences),
    locations: values(facets.locations),
    seasons: populated(facets.seasons),
    timesOfDay: populated(facets.timesOfDay),
    skyClasses: values(facets.skyClasses),
    artifactTypes: values(facets.artifacts),
    hasTimestamps: timestamped.total > 0,
    hasUnsegmented: countOf(facets.segmentation, "unsegmented") > 0,
    oktaCounts: Array.from({ length: 9 }, (_, okta) => countOf(facets.cloudCoverOktas, String(okta))),
  };

  const segmentedImageTotal = countOf(facets.segmentation, "segmented");
  const archiveImageTotal = segmentedImageTotal + countOf(facets.segmentation, "unsegmented");
  const collectionCount = facets.collections.length;

  const matched = page.records;
  const matchedTotal = page.total;
  const nextOffset = offset + query.limit;
  const hasNext = nextOffset < matchedTotal;
  const hasPrevious = offset > 0;
  const previousOffset = Math.max(0, offset - query.limit);

  return (
    <>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Explore" }]} />
      <section className="border-b border-line bg-paper">
        <div className="container-shell py-12 md:py-16">
          <p className="eyebrow text-sky">ALL-SKY CLOUD SEGMENTATION CATALOG</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">Explore the archive</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">
            {archiveImageTotal.toLocaleString()} all-sky frames across {collectionCount} capture sequences.{" "}
            {segmentedImageTotal.toLocaleString()}{" "}
            carry a binary cloud mask, and their cloud cover is measured from that mask against the camera&apos;s field of
            view rather than assigned by hand. The remaining{" "}
            {(archiveImageTotal - segmentedImageTotal).toLocaleString()}{" "}
            are sampled evenly from the frames nobody has segmented yet, and report no cover at all.
          </p>
        </div>
      </section>

      <ExploreShell options={options} resultCount={matchedTotal}>
        {matched.length > 0 ? (
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-9 xl:grid-cols-3">
            {matched.map((image, index) => <FrameCard key={image.id} image={image} priority={index < 3} />)}
          </div>
        ) : (
          <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-pale text-sky"><ImageOff /></span>
            <h2 className="display mt-5 text-3xl">No sky matches this view.</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              {query.oktasMin != null && query.oktasMax != null && query.oktasMin > query.oktasMax
                ? // Distinct from an ordinary empty result: this range can never
                  // match anything, by construction, so say that rather than
                  // suggesting a widen that would not fix it.
                  `Minimum cover (${query.oktasMin}/8) is above maximum (${query.oktasMax}/8), so no frame can satisfy both.`
                : "Try widening the cloud-cover range or clearing a filter."}
            </p>
            <Link href="/explore" className="button-primary mt-6">Clear all filters</Link>
          </div>
        )}

        {matchedTotal > query.limit && (
          <nav aria-label="Pagination" className="mt-14 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted">
              Showing {(offset + 1).toLocaleString()}–{Math.min(nextOffset, matchedTotal).toLocaleString()} of {matchedTotal.toLocaleString()}
            </span>
            <div className="flex gap-2">
              {hasPrevious ? (
                <Link href={pageHref(params, previousOffset > 0 ? encodeOffsetCursor(previousOffset) : undefined)} className="button-secondary min-h-10 flex-1 whitespace-nowrap sm:flex-none">
                  <span aria-hidden="true">←</span> Previous
                </Link>
              ) : null}
              {hasNext ? (
                <Link href={pageHref(params, encodeOffsetCursor(nextOffset))} className="button-secondary min-h-10 flex-1 whitespace-nowrap sm:flex-none">
                  Next page <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          </nav>
        )}
      </ExploreShell>
    </>
  );
}
