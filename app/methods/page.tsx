import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Methods", description: "The demonstration capture, expert labelling, processing, and release workflow modelled by WASCAT v1.0." };

const stages = [
  ["01", "Represent", "Fixture metadata models a fixed or rectilinear sky view alongside UTC time, a camera profile, and regional context."],
  ["02", "Quality control", "The reference workflow checks for occlusion, optics contamination, exposure anomalies, duplicates, and corrupt sources."],
  ["03", "Process", "Release-pinned example pipelines normalize imagery and associate masks, overlays, labels, and diagnostics."],
  ["04", "Expert review", "The demonstration label set models stratified review across nine classes and four West African seasons."],
  ["05", "Package", "Artifacts, metadata, licenses, demonstration citations, manifests, and SHA-256 checksums form an immutable release."],
];

export default function MethodsPage() {
  return (
    <>
      <section className="bg-[#eaf4f8] py-16 md:py-24"><div className="container-shell grid gap-8 md:grid-cols-[.8fr_1.2fr]"><p className="eyebrow text-sky">FROM IMAGE TO COLLECTION</p><div><h1 className="display text-5xl leading-tight md:text-7xl">A transparent model for regional sky data.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted">WASCAT v1.0 demonstrates how sources, expert labels, processing context, and release history can stay connected across Ghana, Nigeria, and Burkina Faso.</p><p className="mt-5 max-w-2xl text-sm leading-6 text-muted">This is a reference workflow illustrated with fixture records and documentary-style assets, not a claim of operational stations, instruments, measurements, or published releases.</p></div></div></section>
      <section className="container-shell py-16 md:py-24"><div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr]"><div><p className="eyebrow text-sky">REFERENCE WORKFLOW</p><h2 className="display mt-3 text-4xl">Five gates to publication</h2><p className="mt-5 text-sm leading-6 text-muted">The model keeps a release in draft until every manifest record and referenced object passes validation.</p></div><ol className="border-t border-[#9fb2bd]">{stages.map(([number, title, body]) => <li key={number} className="grid grid-cols-[42px_1fr] gap-x-3 gap-y-2 border-b border-[#d7e2e9] py-7 sm:grid-cols-[55px_150px_1fr] sm:gap-3"><span className="font-mono text-xs text-sky">{number}</span><h3 className="font-bold">{title}</h3><p className="col-start-2 text-sm leading-6 text-muted sm:col-start-auto">{body}</p></li>)}</ol></div></section>
      <section className="bg-[#102f41] py-16 text-white md:py-24"><div className="container-shell grid gap-12 md:grid-cols-2"><div><p className="eyebrow text-[#91c8e2]">SEGMENTATION OUTPUT</p><h2 className="display mt-3 text-4xl">What a mask means</h2><p className="mt-5 leading-7 text-[#bdd0da]">Masks encode a binary cloud-versus-background decision in the source image coordinate system. Overlays are visual diagnostics; masks are the analysis-ready artifact.</p></div><div className="grid grid-cols-2 gap-3 sm:gap-5">{[["1", "Cloud pixel"], ["0", "Sky/background pixel"], ["255", "8-bit mask value"], ["PNG", "Lossless encoding"]].map(([value, label]) => <div key={label} className="border border-white/15 p-4 sm:p-5"><strong className="display text-3xl text-[#d9ee9d]">{value}</strong><p className="mt-2 text-xs leading-5 text-[#bdd0da]">{label}</p></div>)}</div></div></section>
      <section className="container-shell grid gap-12 py-16 md:grid-cols-3 md:py-24"><div><p className="eyebrow text-sky">REPRODUCIBILITY</p><h2 className="display mt-3 text-4xl">The release is the unit of record.</h2></div><div className="md:col-span-2 grid gap-8 sm:grid-cols-2">{["Published releases are never changed in place.", "Every file is listed in a manifest with a SHA-256 checksum.", "Collection-specific metadata is namespaced without hiding normalized fields.", "Corrections create a new version; earlier versions stay downloadable."].map((item) => <div key={item} className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-sky" /><p className="text-sm leading-6 text-muted">{item}</p></div>)}</div></section>
      <section className="border-t border-[#d7e2e9] bg-paper py-14"><div className="container-shell flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="eyebrow text-sky">PUT THE METHOD TO WORK</p><h2 className="display mt-2 text-3xl">Inspect an image and its artifacts.</h2></div><Link href="/explore" className="button-primary">Explore the archive <ArrowRight size={16} /></Link></div></section>
    </>
  );
}
