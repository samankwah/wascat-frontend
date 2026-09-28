"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { sequenceLabel } from "@/lib/format";
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
  sequenceIds: string[];
  locations: string[];
  seasons: string[];
  timesOfDay: string[];
  skyClasses: string[];
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

const chipFields = ["q", "collection", "release", "sequence", "segmented", "oktas", "oktasMin", "oktasMax", "season", "time", "location", "skyClass", "cloudType", "artifact", "from", "to"] as const;

const chipLabels: Record<string, string> = {
  q: "Search",
  collection: "Collection",
  release: "Release",
  sequence: "Sequence",
  segmented: "Segmentation",
  oktas: "Cloud cover",
  // No longer offered in the panel, but older links may still carry them;
  // the chips keep such a filter visible and removable.
  oktasMin: "Min cover",
  oktasMax: "Max cover",
  season: "Season",
  time: "Time of day",
  location: "Location",
  skyClass: "Sky class",
  cloudType: "Cloud type",
  artifact: "Artifact",
  from: "From",
  to: "To",
};

const oktaOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function Panel({
  options,
  value,
  update,
  clear,
  activeCount,
}: {
  options: ExploreOptions;
  value: (key: string) => string;
  update: (key: string, next: string) => void;
  clear: () => void;
  activeCount: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink"><SlidersHorizontal size={16} className="text-sky" aria-hidden="true" /> Filters</span>
        <button type="button" onClick={clear} disabled={activeCount === 0} className="text-xs font-semibold text-sky hover:underline disabled:cursor-default disabled:text-muted-dim disabled:no-underline">Clear all</button>
      </div>

      <label>
        <span className="field-label">Search</span>
        <span className="relative block">
          <Search size={18} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-dim" />
          <input className="field-input search-field-input rounded-lg" defaultValue={value("q")} onBlur={(event) => update("q", event.target.value)} placeholder="Record ID, sequence, or frame" />
        </span>
      </label>

      <label>
        <span className="field-label">Collection</span>
        <select className="field-select rounded-lg" value={value("collection")} onChange={(event) => update("collection", event.target.value)}>
          <option value="">All collections</option>
          {options.collections.map((item) => <option key={item.slug} value={item.slug}>{item.shortTitle}</option>)}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="field-label">Release</span>
          <select className="field-select rounded-lg" value={value("release")} onChange={(event) => update("release", event.target.value)}>
            <option value="">Any</option>
            {options.releases.map((release) => <option key={release}>{release}</option>)}
          </select>
        </label>
        <label>
          <span className="field-label">Sequence</span>
          <select className="field-select rounded-lg" value={value("sequence")} onChange={(event) => update("sequence", event.target.value)}>
            <option value="">Any</option>
            {options.sequenceIds.map((sequenceId) => (
              <option key={sequenceId} value={sequenceId}>Sequence {sequenceLabel(sequenceId)}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Only some frames have been segmented, so cloud cover is a filter that
          silently excludes the rest. Make that switchable rather than implicit. */}
      {options.hasUnsegmented && (
        <label>
          <span className="field-label">Segmentation</span>
          <select className="field-select rounded-lg" value={value("segmented")} onChange={(event) => update("segmented", event.target.value)}>
            <option value="">All frames</option>
            <option value="true">Segmented (has cloud mask)</option>
            <option value="false">Not yet segmented</option>
          </select>
        </label>
      )}

      <label>
        <span className="field-label">Cloud cover</span>
        <select className="field-select rounded-lg" value={value("oktas")} onChange={(event) => update("oktas", event.target.value)}>
          <option value="">Any</option>
          {oktaOptions.map((okta) => (
            <option key={okta} value={okta} disabled={options.oktaCounts[okta] === 0}>
              {oktaLabel(okta)} ({options.oktaCounts[okta].toLocaleString("en-GB")})
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">Required artifact</span>
        <select className="field-select rounded-lg" value={value("artifact")} onChange={(event) => update("artifact", event.target.value)}>
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
          <select className="field-select rounded-lg" value={value("location")} onChange={(event) => update("location", event.target.value)}>
            <option value="">All locations</option>
            {options.locations.map((location) => <option key={location}>{location}</option>)}
          </select>
        </label>
      )}

      {options.skyClasses.length > 0 && (
        <label>
          <span className="field-label">Sky class</span>
          <select className="field-select rounded-lg" value={value("skyClass")} onChange={(event) => update("skyClass", event.target.value)}>
            <option value="">Any</option>
            {options.skyClasses.map((skyClass) => <option key={skyClass}>{skyClass}</option>)}
          </select>
        </label>
      )}

      {(options.seasons.length > 0 || options.timesOfDay.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {options.seasons.length > 0 && (
            <label>
              <span className="field-label">Season</span>
              <select className="field-select rounded-lg" value={value("season")} onChange={(event) => update("season", event.target.value)}>
                <option value="">Any</option>
                {options.seasons.map((season) => <option key={season}>{season}</option>)}
              </select>
            </label>
          )}
          {options.timesOfDay.length > 0 && (
            <label>
              <span className="field-label">Time of day</span>
              <select className="field-select rounded-lg" value={value("time")} onChange={(event) => update("time", event.target.value)}>
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
            <label><span className="sr-only">From date</span><input type="date" className="field-input rounded-lg text-xs" defaultValue={value("from")} onBlur={(event) => update("from", event.target.value)} /></label>
            <label><span className="sr-only">To date</span><input type="date" className="field-input rounded-lg text-xs" defaultValue={value("to")} onBlur={(event) => update("to", event.target.value)} /></label>
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
  const chipValue = (field: string) => {
    const raw = value(field);
    if (field === "collection") return collectionLabel(raw);
    if (field === "sequence") return sequenceLabel(raw);
    if (field === "segmented") return raw === "true" ? "Segmented" : "Not segmented";
    if (field === "oktas" || field === "oktasMin" || field === "oktasMax") return oktaLabel(Number(raw));
    return raw;
  };

  return (
    <div className="container-shell relative pb-14 pt-8 md:pb-20 md:pt-10">
      <div className="grid gap-8 lg:grid-cols-[272px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(27,73,103,.06)]">
            <Panel options={options} value={value} update={update} clear={clear} activeCount={active.length} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-[0_2px_8px_rgba(27,73,103,.06)] sm:px-5">
            <p className="text-sm text-muted" aria-live="polite">
              <span className="tabular font-semibold text-ink">{resultCount.toLocaleString("en-GB")}</span> frame{resultCount === 1 ? "" : "s"} found
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-ink hover:border-sky hover:text-sky lg:hidden">
                <Filter size={16} aria-hidden="true" /> Filters
                {active.length > 0 && <span className="tabular rounded-full bg-sky px-1.5 text-[.71rem] font-bold leading-5 text-white">{active.length}</span>}
              </button>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                <span className="sr-only sm:not-sr-only">Sort by</span>
                <select className="field-select explore-sort h-10 w-auto rounded-lg text-sm" value={value("sort") || "newest"} onChange={(event) => update("sort", event.target.value === "newest" ? "" : event.target.value)}>
                  <option value="newest">Latest first</option>
                  <option value="oldest">Earliest first</option>
                </select>
              </label>
            </div>
          </div>

          {active.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {active.map((field) => (
                <button
                  type="button"
                  key={field}
                  onClick={() => update(field, "")}
                  aria-label={`Remove filter ${chipLabels[field]}: ${chipValue(field)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky/25 bg-sky-pale py-1 pl-3 pr-2 text-xs text-sky-dark transition-colors hover:border-sky hover:bg-sky-mist"
                >
                  <span className="text-muted">{chipLabels[field]}</span>
                  <span className="font-semibold">{chipValue(field)}</span>
                  <X size={13} aria-hidden="true" />
                </button>
              ))}
              <button type="button" onClick={clear} className="px-2 text-xs font-semibold text-sky hover:underline">Clear all</button>
            </div>
          )}

          {children}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Image filters">
          <button aria-label="Close filters" className="absolute inset-0 bg-ink-abyss/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 right-0 top-0 flex w-[min(90vw,390px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-lg font-semibold text-ink">Filter frames</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="-mr-2 rounded-lg p-2 text-muted hover:bg-paper hover:text-ink"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <Panel options={options} value={value} update={update} clear={clear} activeCount={active.length} />
            </div>
            <div className="border-t border-line px-6 py-4">
              <button type="button" onClick={() => setDrawerOpen(false)} className="button-primary w-full rounded-lg">
                Show {resultCount.toLocaleString("en-GB")} frame{resultCount === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
