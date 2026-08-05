import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, Box, Camera, Clock3, ExternalLink, FileJson2, MapPin, ScanLine } from "lucide-react";
import { ArtifactViewer } from "@/components/artifact-viewer";
import { CopyButton } from "@/components/copy-button";
import { collectionBySlug, collectionTitle, formatDate, imageById, images } from "@/lib/catalog";

export function generateStaticParams() { return images.map((record) => ({ id: record.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> { const record = imageById((await params).id); return { title: record?.id ?? "Image record", description: record?.alt }; }

export default async function ImageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const record = imageById((await params).id);
  if (!record) notFound();
  const collection = collectionBySlug(record.collection)!;
  const apiUrl = `https://wascat.example.org/api/v1/images/${record.id}`;
  const related = images.filter((item) => item.collection === record.collection && item.id !== record.id).slice(0, 3);
  return (
    <>
      <section className="bg-[#0d2635] text-white">
        <div className="container-shell py-5"><Link href="/explore" className="inline-flex items-center gap-2 text-xs font-bold text-white/65 hover:text-white"><ArrowLeft size={14} /> Back to results</Link></div>
        <div className="container-shell grid gap-9 pb-14 lg:grid-cols-[1.45fr_.55fr] lg:pb-20">
          <ArtifactViewer record={record} />
          <aside className="lg:pt-12">
            <p className="eyebrow text-[#91c8e2]">DEMONSTRATION RECORD</p><h1 className="mt-3 break-all font-mono text-xl font-bold leading-7">{record.id}</h1><p className="mt-3 text-sm text-white/65">{collectionTitle(record.collection)} · fixture release {record.release}</p>
            <div className="mt-8 grid border-t border-white/20">{[[Clock3, "Represented capture", formatDate(record.capturedAt, true)], [MapPin, "Location", record.location], [ScanLine, "Expert label", `${record.skyClass} · ${record.season} · ${record.tags.join(", ")}`], [Camera, "Camera profile", record.instrument], [Box, "Dimensions", `${record.width} × ${record.height} pixels`]].map(([Icon, label, body]) => { const Graphic = Icon as typeof Clock3; return <div key={String(label)} className="grid grid-cols-[24px_1fr] gap-3 border-b border-white/15 py-4"><Graphic size={16} className="text-[#91c8e2]" /><div><p className="eyebrow text-white/45">{String(label)}</p><p className="mt-1 text-xs leading-5">{String(body)}</p></div></div>; })}</div>
            <Link href={`/collections/${record.collection}`} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#b9dff0]">View collection methodology <ExternalLink size={13} /></Link>
          </aside>
        </div>
      </section>

      <section className="container-shell grid gap-12 py-14 md:grid-cols-[1.25fr_.75fr] md:py-20">
        <div className="min-w-0">
          <p className="eyebrow text-sky">AVAILABLE FILES</p><h2 className="display mt-3 text-4xl">Download artifacts</h2>
          <div className="mt-7 border-t border-[#9fb2bd]">{record.artifacts.map((artifact) => <div key={artifact.type} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#d7e2e9] py-4 sm:grid-cols-[minmax(0,1fr)_110px_160px_auto] sm:gap-5"><div className="min-w-0"><p className="text-sm font-bold capitalize">{artifact.type === "source" ? "Source image" : `${artifact.type} artifact`}</p><p className="mt-1 break-all font-mono text-[.64rem] text-muted">{record.id.toLowerCase()}_{artifact.type}.{artifact.type === "mask" ? "png" : "jpg"}</p></div><span className="hidden text-xs text-muted sm:block">{(artifact.bytes / 1_000_000).toFixed(1)} MB</span><span className="hidden font-mono text-[.62rem] text-muted sm:block">SHA-256 {artifact.checksum.slice(0, 10)}…</span><a href={artifact.url} download className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9fb2bd] hover:border-[#1c6d99] hover:text-sky" aria-label={`Download ${artifact.type}`}><ArrowDownToLine size={16} /></a></div>)}</div>
          <div className="mt-8"><p className="eyebrow text-muted">PROVENANCE</p><p className="mt-3 text-sm leading-6 text-muted">This expert-labelled demonstration record represents the {collection.title} fixture and uses an illustrative documentary-style image. Its metadata models normalization, obstruction screening, and segmentation with reference pipeline <code className="bg-[#eef3f5] px-1.5 py-1 text-xs text-[#24485b]">wascat-seg/1.0-demo</code>. It is not an operational observation and remains immutable within fixture release {record.release}.</p></div>
        </div>
        <aside className="min-w-0 space-y-5">
          <div className="border border-[#d7e2e9] bg-paper p-5"><div className="flex items-center gap-2"><FileJson2 size={18} className="text-sky" /><h2 className="font-bold">Use this record in code</h2></div><div className="mt-4 overflow-x-auto bg-[#102433] p-4 font-mono text-[.68rem] leading-5 text-[#d4e8f1]"><code className="whitespace-nowrap">curl {apiUrl}</code></div><div className="mt-4"><CopyButton value={apiUrl} label="Copy API URL" /></div></div>
          <div className="border border-[#d7e2e9] p-5"><p className="eyebrow text-muted">STABLE DEMONSTRATION REFERENCE</p><p className="mt-3 break-all font-mono text-[.68rem] leading-5">wascat:{record.collection}:{record.release}:{record.id}</p><p className="mt-3 text-xs leading-5 text-muted">Use the stable identifier and fixture release when testing integrations so this exact demonstration record can be recovered.</p></div>
        </aside>
      </section>

      <section className="border-t border-[#d7e2e9] bg-paper py-16"><div className="container-shell"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow text-sky">NEARBY IN THE COLLECTION</p><h2 className="display mt-3 text-4xl">Related observations</h2></div><Link href={`/explore?collection=${record.collection}`} className="shrink-0 text-xs font-bold text-sky">View all →</Link></div><div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-5">{related.map((item) => <Link href={`/images/${item.id}`} key={item.id} className="group min-w-0 last:col-span-2 sm:last:col-span-1"><div className="image-zoom relative aspect-[4/3]"><Image src={item.image} alt={item.alt} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" /></div><p className="mt-3 break-all font-mono text-[.68rem] font-bold sm:text-xs">{item.id}</p><p className="mt-1 text-[.68rem] leading-4 text-muted sm:text-xs">{formatDate(item.capturedAt)} · {item.skyClass}</p></Link>)}</div></div></section>
    </>
  );
}
