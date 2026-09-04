import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Copy } from "lucide-react";

export const metadata: Metadata = { title: "API documentation", description: "Query WASCAT West African demonstration collections, records, artifacts, and facets." };
const endpoints = [
  ["GET", "/api/v1/collections", "List published collections"],
  ["GET", "/api/v1/collections/{slug}", "Retrieve collection metadata"],
  ["GET", "/api/v1/collections/{slug}/releases", "List immutable releases"],
  ["GET", "/api/v1/images", "Search and filter images"],
  ["GET", "/api/v1/images/{id}", "Retrieve an image and its artifacts"],
  ["GET", "/api/v1/facets", "Retrieve available facets and counts"],
];

export default function ApiDocsPage() {
  return (
    <>
      <section className="bg-ink-panel py-16 text-white md:py-24"><div className="container-shell grid gap-8 md:grid-cols-[1fr_1fr] md:items-end"><div><p className="eyebrow text-sky-light">REST API · VERSION 1</p><h1 className="display mt-4 text-5xl md:text-7xl">Archive access, without an account.</h1></div><div><p className="leading-7 text-on-dark">Read West African demonstration collection, release, image, artifact, and facet metadata with predictable JSON envelopes and stable identifiers.</p><div className="mt-6 flex gap-4 text-xs"><span className="rounded-full bg-lime px-3 py-1.5 font-bold text-lime-ink">DEMONSTRATION</span><span className="py-1.5 text-white/60">Base URL · /api/v1</span></div></div></div></section>
      <section className="container-shell grid gap-12 py-14 lg:grid-cols-[220px_1fr] lg:py-20"><aside className="hidden lg:block"><nav aria-label="API sections" className="sticky top-6 border-l border-line text-xs"><a href="#quickstart" className="block border-l-2 border-sky px-4 py-2 font-bold text-sky">Quickstart</a><a href="#endpoints" className="block px-4 py-2 text-muted">Endpoints</a><a href="#filters" className="block px-4 py-2 text-muted">Filters</a><a href="#envelope" className="block px-4 py-2 text-muted">Response envelope</a><a href="#limits" className="block px-4 py-2 text-muted">Limits & caching</a></nav></aside><div className="min-w-0 max-w-4xl">
        <section id="quickstart"><p className="eyebrow text-sky">QUICKSTART</p><h2 className="display mt-3 text-4xl">Make your first request</h2><p className="mt-4 text-sm leading-6 text-muted">No token is required. Ask for up to 100 demonstration records at once; follow cursor links for the next page.</p><div className="relative mt-6 overflow-x-auto bg-ink-deep p-5 font-mono text-sm text-sky-mist"><code>curl &quot;https://wascat.example.org/api/v1/images?collection=sahel-sky-observatory&amp;season=Harmattan&amp;limit=20&quot;</code><Copy size={15} className="absolute right-4 top-4 text-white/45" /></div></section>
        <section id="endpoints" className="mt-16"><p className="eyebrow text-sky">ENDPOINTS</p><div className="mt-5 border-t border-line-strong">{endpoints.map(([method, path, description]) => <div key={path} className="grid grid-cols-[52px_1fr] gap-2 border-b border-line py-4 sm:grid-cols-[52px_1fr_1fr]"><span className="w-fit rounded bg-lime px-2 py-1 text-[.6rem] font-bold">{method}</span><Link href={path.replace("{slug}", "kumasi-convective-skies").replace("{id}", "WAS-KMS-20240718-121530")} className="break-all font-mono text-xs font-bold text-sky">{path}</Link><span className="col-span-2 text-xs text-muted sm:col-span-1">{description}</span></div>)}</div></section>
        <section id="filters" className="mt-16"><p className="eyebrow text-sky">IMAGE QUERY PARAMETERS</p><h2 className="display mt-3 text-4xl">Combine filters freely</h2><div className="mt-6 grid grid-cols-2 gap-3">{[["collection", "Stable collection slug"], ["release", "Explicit release version"], ["q", "Identifier, place, or tag"], ["from / to", "ISO 8601 capture dates"], ["class", "One of nine supported sky classes"], ["season", "Harmattan, dry season, wet season, transition"], ["time", "Normalized time of day"], ["location", "Kumasi, Lagos, or Ouagadougou"], ["artifact", "Required artifact type"], ["sort", "newest or oldest"], ["cursor / limit", "Opaque cursor; limit 1–100"]].map(([name, description]) => <div key={name} className="min-w-0 border border-line p-3 sm:p-4"><code className="break-words text-xs font-bold text-sky">{name}</code><p className="mt-2 text-xs leading-5 text-muted">{description}</p></div>)}</div></section>
        <section id="envelope" className="mt-16"><p className="eyebrow text-sky">RESPONSE ENVELOPE</p><h2 className="display mt-3 text-4xl">Consistent at every endpoint</h2><pre className="mt-6 overflow-x-auto bg-ink-deep p-5 text-xs leading-6 text-sky-mist"><code>{`{
  "data": [{ "id": "WAS-OUA-20250108-093300", ... }],
  "meta": { "apiVersion": "1.0", "count": 20 },
  "links": { "self": "...", "next": "...?cursor=eyJ..." }
}`}</code></pre></section>
        <section id="limits" className="mt-16"><p className="eyebrow text-sky">LIMITS & CACHING</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{["Anonymous clients receive 120 requests per minute per IP.", "Public responses are CDN-cacheable for five minutes.", "A bounded limit prevents responses larger than 100 records.", "CORS is enabled for public, read-only GET requests."].map((item) => <div key={item} className="flex gap-2 text-sm leading-6 text-muted"><Check size={16} className="mt-1 shrink-0 text-sky" />{item}</div>)}</div></section>
      </div></section>
      <section className="border-t border-line bg-paper py-14"><div className="container-shell flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="eyebrow text-sky">PREFER TO LOOK FIRST?</p><h2 className="display mt-2 text-3xl">The catalog and API use the same filters.</h2></div><Link href="/explore" className="button-primary">Open catalog <ArrowRight size={16} /></Link></div></section>
    </>
  );
}
