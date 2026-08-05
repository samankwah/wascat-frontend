import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, ArrowRight, CalendarDays, Camera, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { collectionBySlug, collections, formatDate, images } from "@/lib/catalog";

export function generateStaticParams() { return collections.map((collection) => ({ slug: collection.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const collection = collectionBySlug((await params).slug); return { title: collection?.title ?? "Collection", description: collection?.description }; }

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const collection = collectionBySlug((await params).slug);
  if (!collection) notFound();
  const current = collection.releases.find((release) => release.current)!;
  const samples = images.filter((item) => item.collection === collection.slug).slice(0, 4);
  const fixtureDownloadUrl = `/api/v1/images?collection=${collection.slug}&release=${current.version}&limit=100`;
  const citationValue = collection.doi ? `${collection.citation} https://doi.org/${collection.doi}` : collection.citation;
  return (
    <>
      <section className="bg-paper">
        <div className="container-shell py-5"><Link href="/collections" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-sky"><ArrowLeft size={14} /> All collections</Link></div>
        <div className="container-shell grid gap-10 pb-14 md:grid-cols-[1.03fr_.97fr] md:items-end md:pb-20">
          <div className="pb-2"><p className="eyebrow text-sky">{collection.kicker}</p><h1 className="display mt-4 text-5xl leading-[.98] md:text-7xl">{collection.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{collection.description}</p><div className="mt-8 flex flex-wrap gap-3"><a href={fixtureDownloadUrl} download className="button-primary"><ArrowDownToLine size={17} /> Download fixture JSON</a><Link href={`/explore?collection=${collection.slug}`} className="button-secondary">Explore images <ArrowRight size={16} /></Link></div></div>
          <div className="relative aspect-[4/3] overflow-hidden"><Image src={collection.image} alt={collection.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /><span className="absolute bottom-3 right-3 bg-[#102433]/80 px-3 py-1.5 text-[.6rem] font-bold tracking-wide text-white">ILLUSTRATIVE IMAGE</span></div>
        </div>
      </section>

      <section className="border-y border-[#d7e2e9]"><div className="container-shell grid grid-cols-2 md:grid-cols-4">{[[MapPin, "Location", collection.location], [CalendarDays, "Coverage", collection.coverage], [Camera, "Instrument", collection.instrument], [ShieldCheck, "License", collection.license.replace(" International", "")]].map(([Icon, label, body], index) => { const Graphic = Icon as typeof MapPin; return <div key={String(label)} className={`min-h-36 border-[#d7e2e9] p-4 sm:p-5 ${index % 2 === 1 ? "border-l" : ""} ${index > 1 ? "border-t" : ""} md:border-l md:border-t-0 ${index === 0 ? "md:border-l-0" : ""}`}><Graphic size={18} className="text-sky" /><p className="eyebrow mt-5 text-muted">{String(label)}</p><p className="mt-2 text-xs leading-5">{String(body)}</p></div>; })}</div></section>

      <section className="container-shell grid gap-14 py-16 md:grid-cols-[1.45fr_.55fr] md:py-24">
        <div>
          <p className="eyebrow text-sky">SAMPLE OBSERVATIONS</p><h2 className="display mt-3 text-4xl">Inside this collection</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-5">{samples.map((sample) => <Link href={`/images/${sample.id}`} key={sample.id} className="group min-w-0"><div className="image-zoom relative aspect-[4/3]"><Image src={sample.image} alt={sample.alt} fill sizes="(max-width: 640px) 50vw, 35vw" className="object-cover" /></div><p className="mt-3 break-all font-mono text-[.68rem] font-bold sm:text-xs">{sample.id}</p><p className="mt-1 text-[.68rem] leading-4 text-muted sm:text-xs">{sample.skyClass} · {formatDate(sample.capturedAt)}</p></Link>)}</div>
        </div>
        <aside>
          <p className="eyebrow text-sky">DEMONSTRATION TOTALS</p><dl className="mt-4 border-t border-[#9fb2bd]">{[[collection.images.toLocaleString(), "Represented source images"], [collection.artifacts.toLocaleString(), "Represented derived artifacts"], [collection.releases.length, "Fixture releases"], [current.size, "Illustrative bundle"]].map(([value, label]) => <div key={String(label)} className="flex items-end justify-between border-b border-[#d7e2e9] py-4"><dt className="text-xs text-muted">{label}</dt><dd className="display text-2xl">{value}</dd></div>)}</dl>
          <div className="mt-10 border border-[#d7e2e9] bg-paper p-5"><p className="eyebrow">Reference bundle model</p><ul className="mt-4 space-y-2 text-xs leading-5 text-muted"><li>Source images and derived artifacts</li><li>CSV and JSON metadata exports</li><li>Manifest and SHA-256 checksums</li><li>License and demonstration citation files</li></ul></div>
        </aside>
      </section>

      <section className="bg-[#eaf4f8] py-16 md:py-20"><div className="container-shell grid gap-10 md:grid-cols-[.75fr_1.25fr]">
        <div><p className="eyebrow text-sky">METHOD & USE</p><h2 className="display mt-3 text-4xl">Transparent by design</h2></div>
        <div className="grid gap-8 sm:grid-cols-2"><div><h3 className="font-bold">Processing summary</h3><p className="mt-3 text-sm leading-6 text-muted">The fixture models radiometric normalization, obstruction screening, release-pinned segmentation, and stratified expert review. It documents an intended workflow rather than an operational processing claim.</p><Link href="/methods" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky">Full methodology <ArrowRight size={14} /></Link></div><div><h3 className="font-bold">Recommended use</h3><p className="mt-3 text-sm leading-6 text-muted">Suitable for evaluating catalog interfaces, metadata workflows, teaching examples, and archive integration. Do not use fixture counts or labels for climatological inference.</p>{collection.doi && <a href={`https://doi.org/${collection.doi}`} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky">Related publication <ExternalLink size={13} /></a>}</div></div>
      </div></section>

      <section className="container-shell grid gap-12 py-16 md:grid-cols-2 md:py-24">
        <div><p className="eyebrow text-sky">DEMONSTRATION CITATION</p><div className="mt-4 border-l-2 border-[#1c6d99] pl-5"><p className="display text-xl leading-8">{collection.citation}</p>{collection.doi && <p className="mt-3 font-mono text-xs text-muted">https://doi.org/{collection.doi}</p>}<div className="mt-4"><CopyButton value={citationValue} label="Copy citation" /></div></div></div>
        <div><p className="eyebrow text-sky">LICENSE</p><h2 className="mt-4 font-bold">{collection.license}</h2><p className="mt-3 text-sm leading-6 text-muted">You may share and adapt this collection with appropriate credit, a license link, and an indication of changes. Artifact-level metadata inherits this license unless noted.</p></div>
      </section>

      <section className="border-t border-[#d7e2e9] py-16"><div className="container-shell"><div className="flex items-center justify-between"><div><p className="eyebrow text-sky">FIXTURE RELEASE HISTORY</p><h2 className="display mt-3 text-4xl">Stable by version</h2></div><span className="hidden rounded-full bg-[#d9ee9d] px-3 py-1 text-xs font-bold sm:block">v{current.version} is current</span></div><div className="mt-7 overflow-x-auto"><table className="w-full min-w-[650px] border-collapse text-left text-sm"><thead><tr className="border-b border-[#9fb2bd] text-[.65rem] uppercase tracking-[.1em] text-muted"><th className="py-3">Version</th><th>Published</th><th>Images</th><th>Est. size</th><th>SHA-256</th><th></th></tr></thead><tbody>{collection.releases.map((release) => <tr key={release.version} className="border-b border-[#d7e2e9]"><td className="py-4 font-bold">v{release.version} {release.current && <span className="ml-2 rounded-full bg-[#d9ee9d] px-2 py-1 text-[.6rem]">CURRENT</span>}</td><td>{formatDate(release.publishedAt)}</td><td>{release.images.toLocaleString()}</td><td>{release.size}</td><td className="font-mono text-xs text-muted">{release.checksum.slice(0, 12)}…</td><td className="text-right"><a href={fixtureDownloadUrl} download className="text-xs font-bold text-sky">Metadata</a></td></tr>)}</tbody></table></div></div></section>
    </>
  );
}
