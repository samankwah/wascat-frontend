import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
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
  const currentPage = Math.floor(offset / query.limit) + 1;
  const pageCount = Math.max(1, Math.ceil(matchedTotal / query.limit));
  const invertedRange = query.oktasMin != null && query.oktasMax != null && query.oktasMin > query.oktasMax;

  const summary: [string, string][] = [
    [archiveImageTotal.toLocaleString("en-GB"), "Frames"],
    [segmentedImageTotal.toLocaleString("en-GB"), "With cloud mask"],
    [collectionCount.toLocaleString("en-GB"), "Capture sequences"],
  ];

  return (
    <>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Explore" }]} />
      <div className="relative bg-paper text-ink">
        {/* The same sky wash the statistics page opens with. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-sky-wash to-transparent" />

        <section className="container-shell relative pb-2 pt-12 md:pt-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full bg-white px-3 py-1 font-mono text-[.71rem] font-semibold uppercase tracking-[.14em] text-sky ring-1 ring-sky/40">
                Image archive
              </p>
              <h1 className="mt-4 text-[clamp(2.4rem,5vw,3.4rem)] font-bold leading-tight tracking-tight text-ink">Explore the Archive</h1>
              <p className="mt-3 text-[1.05rem] leading-7 text-muted">
                Search all-sky frames by capture sequence, cloud cover and available artifacts. Cloud cover is measured
                from each frame&apos;s segmentation mask, so frames not yet segmented report none.
              </p>
            </div>

            <dl className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_8px_rgba(27,73,103,.06)] lg:min-w-[440px]">
              {summary.map(([value, label]) => (
                <div key={label} className="px-4 py-4 sm:px-5">
                  <dt className="font-mono text-[.65rem] uppercase tracking-[.16em] text-muted-dim sm:text-[.69rem]">{label}</dt>
                  <dd className="tabular mt-1.5 font-mono text-xl font-semibold text-sky sm:text-2xl">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <ExploreShell options={options} resultCount={matchedTotal}>
          {matched.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {matched.map((image, index) => <FrameCard key={image.id} image={image} priority={index < 3} />)}
            </div>
          ) : (
            <div className="mt-6 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-white px-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-sky-pale text-sky"><ImageOff aria-hidden="true" /></span>
              <h2 className="mt-5 text-xl font-semibold text-ink">No frames match these filters</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                {invertedRange
                  ? // Distinct from an ordinary empty result: this range can never
                    // match anything, by construction, so say that rather than
                    // suggesting a widen that would not fix it.
                    `Minimum cover (${query.oktasMin}/8) is above maximum (${query.oktasMax}/8), so no frame can satisfy both.`
                  : "Try widening the cloud-cover range or removing a filter."}
              </p>
              <Link href="/explore" className="button-primary mt-6 rounded-lg">Clear all filters</Link>
            </div>
          )}

          {matchedTotal > query.limit && (
            <nav aria-label="Pagination" className="mt-10 flex flex-col gap-4 rounded-xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-muted">
                Showing{" "}
                <span className="tabular font-semibold text-ink">
                  {(offset + 1).toLocaleString("en-GB")}–{Math.min(nextOffset, matchedTotal).toLocaleString("en-GB")}
                </span>{" "}
                of <span className="tabular font-semibold text-ink">{matchedTotal.toLocaleString("en-GB")}</span>
              </p>
              <div className="flex items-center gap-3">
                <span className="hidden font-mono text-xs text-muted-dim sm:inline">
                  Page {currentPage} of {pageCount}
                </span>
                <div className="flex flex-1 gap-2 sm:flex-none">
                  <PageLink href={hasPrevious ? pageHref(params, previousOffset > 0 ? encodeOffsetCursor(previousOffset) : undefined) : undefined} label="Previous page">
                    <ChevronLeft size={16} aria-hidden="true" /> Previous
                  </PageLink>
                  <PageLink href={hasNext ? pageHref(params, encodeOffsetCursor(nextOffset)) : undefined} label="Next page">
                    Next <ChevronRight size={16} aria-hidden="true" />
                  </PageLink>
                </div>
              </div>
            </nav>
          )}
        </ExploreShell>
      </div>
    </>
  );
}

/** A pagination step; rendered disabled rather than removed, so the pair never shifts. */
function PageLink({ href, label, children }: { href?: string; label: string; children: ReactNode }) {
  const className = "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition-colors sm:flex-none";
  return href ? (
    <Link href={href} aria-label={label} className={`${className} border-line-strong bg-white text-ink hover:border-sky hover:text-sky`}>
      {children}
    </Link>
  ) : (
    <span aria-disabled="true" className={`${className} cursor-not-allowed border-line bg-paper text-muted-dim`}>
      {children}
    </span>
  );
}
