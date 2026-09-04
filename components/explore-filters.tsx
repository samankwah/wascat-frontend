"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, SlidersHorizontal, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { oktaLabel } from "@/lib/vocab";

/**
 * Filter controls for /explore.
 *
 * Filtering and pagination happen on the server; this component only reads and
 * writes the query string. Facet options arrive as props so the client bundle
 * never pulls in the catalogue data.
 */
export type ExploreOptions = {
  collections: { slug: string; shortTitle: string }[];
  releases: string[];
  videoIds: string[];
  locations: string[];
  seasons: string[];
  timesOfDay: string[];
  artifactTypes: string[];
  hasTimestamps: boolean;
  /** True when the catalogue holds frames that have not been segmented. */
  hasUnsegmented: boolean;
  /**
   * How many segmented frames land in each okta bucket, 0-8. The archive's
   * measured range does not necessarily span the whole scale - today nothing
   * falls below 4/8 - and a bucket with nothing in it is still worth showing
   * rather than hiding, the same way the scale itself does not skip numbers.
   * Mirrors the count admin's own oktas filter already shows.
   */
  oktaCounts: number[];
};

const chipFields = ["q", "collection", "release", "video", "segmented", "oktasMin", "oktasMax", "season", "time", "location", "artifact", "from", "to"] as const;

const chipLabels: Record<string, string> = {
  q: "Search",
  collection: "Collection",
  release: "Release",
  video: "Sequence",
  segmented: "Segmentation",
  oktasMin: "Min cover",
  oktasMax: "Max cover",
  season: "Season",
  time: "Time of day",
  location: "Location",
  artifact: "Artifact",
  from: "From",
  to: "To",
};

const oktaOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** True once both ends of the range are set and the range is empty by construction. */
function oktaRangeInverted(value: (key: string) => string): boolean {
  const min = value("oktasMin");
  const max = value("oktasMax");
  return min !== "" && max !== "" && Number(min) > Number(max);
}

function Panel({
  options,
  value,
  update,
  clear,
}: {
  options: ExploreOptions;
  value: (key: string) => string;
  update: (key: string, next: string) => void;
  clear: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <span className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={16} /> Filters</span>
        <button onClick={clear} className="text-xs font-bold text-sky hover:underline">Clear all</button>
      </div>

      <label>
        <span className="field-label">Search</span>
        <span className="relative block">
          <Search size={18} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-dim" />
          <input className="field-input search-field-input" defaultValue={value("q")} onBlur={(event) => update("q", event.target.value)} placeholder="Record ID, sequence, or frame" />
        </span>
      </label>

      <label>
        <span className="field-label">Collection</span>
        <select className="field-select" value={value("collection")} onChange={(event) => update("collection", event.target.value)}>
          <option value="">All collections</option>
          {options.collections.map((item) => <option key={item.slug} value={item.slug}>{item.shortTitle}</option>)}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="field-label">Release</span>
          <select className="field-select" value={value("release")} onChange={(event) => update("release", event.target.value)}>
            <option value="">Any</option>
            {options.releases.map((release) => <option key={release}>{release}</option>)}
          </select>
        </label>
        <label>
          <span className="field-label">Sequence</span>
          <select className="field-select" value={value("video")} onChange={(event) => update("video", event.target.value)}>
            <option value="">Any</option>
            {options.videoIds.map((videoId) => <option key={videoId}>{videoId}</option>)}
          </select>
        </label>
      </div>

      {/* Only some frames have been segmented, so cloud cover is a filter that
          silently excludes the rest. Make that switchable rather than implicit. */}
      {options.hasUnsegmented && (
        <label>
          <span className="field-label">Segmentation</span>
          <select className="field-select" value={value("segmented")} onChange={(event) => update("segmented", event.target.value)}>
            <option value="">All frames</option>
            <option value="true">Segmented (has cloud mask)</option>
            <option value="false">Not yet segmented</option>
          </select>
        </label>
      )}

      <fieldset>
        <legend className="field-label">Cloud cover (oktas)</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="sr-only">Minimum oktas</span>
            <select className="field-select" value={value("oktasMin")} onChange={(event) => update("oktasMin", event.target.value)}>
              <option value="">Min</option>
              {oktaOptions.map((okta) => (
                <option key={okta} value={okta} disabled={options.oktaCounts[okta] === 0}>
                  {oktaLabel(okta)} ({options.oktaCounts[okta].toLocaleString()})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Maximum oktas</span>
            <select className="field-select" value={value("oktasMax")} onChange={(event) => update("oktasMax", event.target.value)}>
              <option value="">Max</option>
              {oktaOptions.map((okta) => (
                <option key={okta} value={okta} disabled={options.oktaCounts[okta] === 0}>
                  {oktaLabel(okta)} ({options.oktaCounts[okta].toLocaleString()})
                </option>
              ))}
            </select>
          </label>
        </div>
        {/* A minimum above the maximum can't match anything - said here rather
            than left for the results grid to explain after the fact. */}
        {oktaRangeInverted(value) && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-danger">
            <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            Minimum is above maximum, so no frame can match. Swap them or clear one.
          </p>
        )}
      </fieldset>

      <label>
        <span className="field-label">Required artifact</span>
        <select className="field-select" value={value("artifact")} onChange={(event) => update("artifact", event.target.value)}>
          <option value="">Any artifact</option>
          {options.artifactTypes.map((artifact) => (
            <option key={artifact} value={artifact}>{artifact === "source" ? "Source frame" : "Segmentation mask"}</option>
          ))}
        </select>
      </label>

      {/* Rendered only when the catalogue actually carries these fields, so the
          panel never offers a filter that cannot match anything. */}
      {options.locations.length > 0 && (
        <label>
          <span className="field-label">Location</span>
          <select className="field-select" value={value("location")} onChange={(event) => update("location", event.target.value)}>
            <option value="">All locations</option>
            {options.locations.map((location) => <option key={location}>{location}</option>)}
          </select>
        </label>
      )}

      {(options.seasons.length > 0 || options.timesOfDay.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {options.seasons.length > 0 && (
            <label>
              <span className="field-label">Season</span>
              <select className="field-select" value={value("season")} onChange={(event) => update("season", event.target.value)}>
                <option value="">Any</option>
                {options.seasons.map((season) => <option key={season}>{season}</option>)}
              </select>
            </label>
          )}
          {options.timesOfDay.length > 0 && (
            <label>
              <span className="field-label">Time of day</span>
              <select className="field-select" value={value("time")} onChange={(event) => update("time", event.target.value)}>
                <option value="">Any</option>
                {options.timesOfDay.map((time) => <option key={time}>{time}</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      {options.hasTimestamps && (
        <fieldset>
          <legend className="field-label">Capture date</legend>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="sr-only">From date</span><input type="date" className="field-input text-xs" defaultValue={value("from")} onBlur={(event) => update("from", event.target.value)} /></label>
            <label><span className="sr-only">To date</span><input type="date" className="field-input text-xs" defaultValue={value("to")} onBlur={(event) => update("to", event.target.value)} /></label>
          </div>
        </fieldset>
      )}
    </div>
  );
}

/**
 * Two-column explore layout. The results grid is rendered on the server and
 * passed in as children, so the catalogue never reaches the client bundle.
 */
export function ExploreShell({
  options,
  resultCount,
  children,
}: {
  options: ExploreOptions;
  resultCount: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const value = (key: string) => params.get(key) ?? "";
  const update = (key: string, next: string) => {
    const query = new URLSearchParams(params.toString());
    if (next) query.set(key, next); else query.delete(key);
    // Any filter change invalidates the current page position.
    query.delete("cursor");
    router.replace(`${pathname}${query.size ? `?${query.toString()}` : ""}`, { scroll: false });
  };
  const clear = () => router.replace(pathname, { scroll: false });

  const active = chipFields.filter((field) => value(field));
  const collectionLabel = (slug: string) => options.collections.find((item) => item.slug === slug)?.shortTitle ?? slug;

  return (
    <div className="container-shell py-9 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-6"><Panel options={options} value={value} update={update} clear={clear} /></div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <p className="text-sm"><strong>{resultCount.toLocaleString()}</strong> record{resultCount === 1 ? "" : "s"} match</p>
            <div className="flex gap-2">
              <button onClick={() => setDrawerOpen(true)} className="button-secondary min-h-10 px-3 lg:hidden">
                <Filter size={16} /> Filters {active.length ? `(${active.length})` : ""}
              </button>
              <label className="flex items-center gap-2 text-xs font-bold">
                <span>Sort</span>
                <select className="h-10 border border-field bg-white px-3" value={value("sort") || "newest"} onChange={(event) => update("sort", event.target.value === "newest" ? "" : event.target.value)}>
                  <option value="newest">Latest first</option>
                  <option value="oldest">Earliest first</option>
                </select>
              </label>
            </div>
          </div>

          {active.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-line py-4" aria-label="Active filters">
              {active.map((field) => (
                <button key={field} onClick={() => update(field, "")} className="flex items-center gap-1.5 rounded-full bg-sky-pale px-3 py-1.5 text-xs font-bold text-sky-dark">
                  {chipLabels[field]}:{" "}
                  {field === "collection"
                    ? collectionLabel(value(field))
                    : field === "segmented"
                      ? value(field) === "true" ? "Segmented" : "Not segmented"
                      : field === "oktasMin" || field === "oktasMax"
                        ? oktaLabel(Number(value(field)))
                        : value(field)}{" "}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Image filters">
          <button aria-label="Close filters" className="absolute inset-0 bg-ink-abyss/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 right-0 top-0 w-[min(90vw,390px)] overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="display text-2xl">Filter records</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="p-2"><X /></button>
            </div>
            <Panel options={options} value={value} update={update} clear={clear} />
            <button onClick={() => setDrawerOpen(false)} className="button-primary mt-8 w-full">Show {resultCount.toLocaleString()} results</button>
          </div>
        </div>
      )}
    </div>
  );
}
