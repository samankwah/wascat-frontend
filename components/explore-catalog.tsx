"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, ImageOff, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { artifactTypes, collectionTitle, collections, formatDate, images, locations, seasons, skyClasses, timesOfDay } from "@/lib/catalog";

const fields = ["q", "collection", "release", "class", "season", "time", "location", "artifact", "from", "to", "sort"] as const;

function FilterPanel({ value, update, clear }: { value: (key: string) => string; update: (key: string, next: string) => void; clear: () => void }) {
  const releases = [...new Set(collections.flatMap((collection) => collection.releases.map((release) => release.version)))];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#d7e2e9] pb-4"><span className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={16} /> Filters</span><button onClick={clear} className="text-xs font-bold text-sky hover:underline">Clear all</button></div>
      <label><span className="field-label">Search</span><span className="relative block"><Search size={18} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526d80]" /><input className="field-input pl-11" value={value("q")} onChange={(event) => update("q", event.target.value)} placeholder="ID, tag, or place" /></span></label>
      <label><span className="field-label">Collection</span><select className="field-select" value={value("collection")} onChange={(event) => update("collection", event.target.value)}><option value="">All collections</option>{collections.map((item) => <option key={item.slug} value={item.slug}>{item.shortTitle}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="field-label">Release</span><select className="field-select" value={value("release")} onChange={(event) => update("release", event.target.value)}><option value="">Any</option>{releases.map((release) => <option key={release}>{release}</option>)}</select></label>
        <label><span className="field-label">Class</span><select className="field-select" value={value("class")} onChange={(event) => update("class", event.target.value)}><option value="">Any</option>{skyClasses.map((skyClass) => <option key={skyClass}>{skyClass}</option>)}</select></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="field-label">Season</span><select className="field-select" value={value("season")} onChange={(event) => update("season", event.target.value)}><option value="">Any</option>{seasons.map((season) => <option key={season}>{season}</option>)}</select></label>
        <label><span className="field-label">Time of day</span><select className="field-select" value={value("time")} onChange={(event) => update("time", event.target.value)}><option value="">Any</option>{timesOfDay.map((time) => <option key={time}>{time}</option>)}</select></label>
      </div>
      <label><span className="field-label">Location</span><select className="field-select" value={value("location")} onChange={(event) => update("location", event.target.value)}><option value="">All locations</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></label>
      <label><span className="field-label">Required artifact</span><select className="field-select" value={value("artifact")} onChange={(event) => update("artifact", event.target.value)}><option value="">Any artifact</option>{artifactTypes.map((artifact) => <option key={artifact} value={artifact}>{artifact === "source" ? "Source image" : artifact === "mask" ? "Segmentation mask" : artifact[0].toUpperCase() + artifact.slice(1)}</option>)}</select></label>
      <fieldset><legend className="field-label">Capture date</legend><div className="grid grid-cols-2 gap-3"><label><span className="sr-only">From date</span><input type="date" className="field-input text-xs" value={value("from")} onChange={(event) => update("from", event.target.value)} /></label><label><span className="sr-only">To date</span><input type="date" className="field-input text-xs" value={value("to")} onChange={(event) => update("to", event.target.value)} /></label></div></fieldset>
    </div>
  );
}

export function ExploreCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const value = (key: string) => params.get(key) ?? "";
  const update = (key: string, next: string) => {
    const query = new URLSearchParams(params.toString());
    if (next) query.set(key, next); else query.delete(key);
    query.delete("cursor");
    router.replace(`${pathname}${query.size ? `?${query.toString()}` : ""}`, { scroll: false });
  };
  const clear = () => router.replace(pathname, { scroll: false });

  const results = useMemo(() => {
    const q = value("q").toLowerCase();
    const from = value("from");
    const to = value("to");
    const filtered = images.filter((item) =>
      (!q || [item.id, item.capturedAt, item.location, item.skyClass, ...item.tags].join(" ").toLowerCase().includes(q)) &&
      (!value("collection") || item.collection === value("collection")) &&
      (!value("release") || item.release === value("release")) &&
      (!value("class") || item.skyClass === value("class")) &&
      (!value("season") || item.season === value("season")) &&
      (!value("time") || item.timeOfDay === value("time")) &&
      (!value("location") || item.location === value("location")) &&
      (!value("artifact") || item.artifacts.some((artifact) => artifact.type === value("artifact"))) &&
      (!from || item.capturedAt.slice(0, 10) >= from) && (!to || item.capturedAt.slice(0, 10) <= to),
    );
    return filtered.sort((a, b) => value("sort") === "oldest" ? a.capturedAt.localeCompare(b.capturedAt) : b.capturedAt.localeCompare(a.capturedAt));
    // URLSearchParams is the source of truth for restoration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const active = fields.filter((field) => field !== "sort" && value(field));
  const labelFor = (field: string) => field === "collection" ? collectionTitle(value(field)) : `${field === "q" ? "Search" : field}: ${value(field)}`;

  return (
    <div className="container-shell py-9 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-6"><FilterPanel value={value} update={update} clear={clear} /></div></aside>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7e2e9] pb-5">
            <p className="text-sm"><strong>{results.length}</strong> demonstration record{results.length === 1 ? "" : "s"} in this catalog preview</p>
            <div className="flex gap-2">
              <button onClick={() => setDrawerOpen(true)} className="button-secondary min-h-10 px-3 lg:hidden"><Filter size={16} /> Filters {active.length ? `(${active.length})` : ""}</button>
              <label className="flex items-center gap-2 text-xs font-bold"><span>Sort</span><select className="h-10 border border-[#b8c8d1] bg-white px-3" value={value("sort") || "newest"} onChange={(event) => update("sort", event.target.value === "newest" ? "" : event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
            </div>
          </div>

          {active.length > 0 && <div className="flex flex-wrap gap-2 border-b border-[#d7e2e9] py-4" aria-label="Active filters">{active.map((field) => <button key={field} onClick={() => update(field, "")} className="flex items-center gap-1.5 rounded-full bg-[#eaf4f8] px-3 py-1.5 text-xs font-bold text-[#155778]">{labelFor(field)} <X size={13} /></button>)}</div>}

          {results.length > 0 ? (
            <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-9 xl:grid-cols-3">
              {results.map((item, index) => (
                <article key={item.id} className="group">
                  <Link href={`/images/${item.id}`}>
                    <div className="image-zoom relative aspect-[4/3] bg-[#dbe7ec]">
                      <Image src={item.image} alt={item.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 30vw" className="object-cover" priority={index < 3} />
                      <div className="absolute left-3 top-3 flex gap-1"><span className="bg-[#102433]/85 px-2 py-1 text-[.6rem] font-bold tracking-wide text-white">SOURCE</span><span className="bg-[#d9ee9d] px-2 py-1 text-[.6rem] font-bold tracking-wide text-[#24331a]">MASK</span></div>
                    </div>
                    <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3"><div className="min-w-0"><h2 className="break-all font-mono text-[.68rem] font-bold tracking-tight sm:text-[.78rem]">{item.id}</h2><p className="mt-1 text-[.68rem] leading-4 text-muted sm:text-xs">{formatDate(item.capturedAt, true)} · {item.location}</p></div><span className="shrink-0 rounded-full border border-[#b8c8d1] px-2 py-1 text-[.55rem] font-bold uppercase sm:text-[.6rem]">{item.skyClass}</span></div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[430px] flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf4f8] text-sky"><ImageOff /></span><h2 className="display mt-5 text-3xl">No sky matches this view.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-muted">Try removing a filter or widening the capture date range.</p><button onClick={clear} className="button-primary mt-6">Clear all filters</button></div>
          )}

          {results.length > 8 && <nav aria-label="Pagination" className="mt-14 flex items-center justify-between border-t border-[#d7e2e9] pt-5"><span className="text-xs text-muted">Page 1 · cursor pagination</span><button className="button-secondary min-h-10">Next page <span aria-hidden="true">→</span></button></nav>}
        </div>
      </div>

      {drawerOpen && <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Image filters"><button aria-label="Close filters" className="absolute inset-0 bg-[#071b27]/60" onClick={() => setDrawerOpen(false)} /><div className="absolute bottom-0 right-0 top-0 w-[min(90vw,390px)] overflow-y-auto bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="display text-2xl">Filter images</h2><button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="p-2"><X /></button></div><FilterPanel value={value} update={update} clear={clear} /><button onClick={() => setDrawerOpen(false)} className="button-primary mt-8 w-full">Show {results.length} results</button></div></div>}
    </div>
  );
}
