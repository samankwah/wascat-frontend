import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Methods", description: "How all-sky frames are paired with their segmentation masks and how cloud cover is measured." };

const stages = [
  ["01", "Capture", "All-sky frames arrive cropped to the camera’s circular field of view, with the corners masked out. The frame index and sequence come from the filename."],
  ["02", "Segment", "A cloud-segmentation model produces one binary mask per frame: white for cloud, black for sky, in the frame’s own coordinate system."],
  ["03", "Register", "Each mask is checked against the camera’s field of view. A mask whose cloud falls outside that circle was rendered at a different scale, and the factor is recovered and recorded."],
  ["04", "Measure", "Cloud cover is the share of the valid circle the mask marks as cloud, reported as a fraction and in oktas. The circle is taken from the frame, not assumed."],
  ["05", "Publish", "Frames, masks, byte sizes and SHA-256 checksums are written into a numbered release and served exactly as delivered."],
];

export default function MethodsPage() {
  return (
    <>
      <section className="bg-sky-pale py-16 md:py-24"><div className="container-shell grid gap-8 md:grid-cols-[.8fr_1.2fr]"><p className="eyebrow text-sky">FROM IMAGE TO COLLECTION</p><div><h1 className="display text-5xl leading-tight md:text-7xl">Measured, not labelled.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted">Every figure in the catalogue is derived from the delivered imagery: cloud cover is counted from the mask against the camera’s field of view, and each file carries its own checksum.</p><p className="mt-5 max-w-2xl text-sm leading-6 text-muted">Fields that depend on capture provenance — site, coordinates, timestamps, instrument — appear only where the capture team has supplied them, and are omitted otherwise rather than estimated.</p></div></div></section>
      <section className="container-shell py-16 md:py-24"><div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr]"><div><p className="eyebrow text-sky">REFERENCE WORKFLOW</p><h2 className="display mt-3 text-4xl">Five gates to publication</h2><p className="mt-5 text-sm leading-6 text-muted">A release stays in draft until every record validates against the ingest contract and every referenced file is present.</p></div><ol className="border-t border-line-strong">{stages.map(([number, title, body]) => <li key={number} className="grid grid-cols-[42px_1fr] gap-x-3 gap-y-2 border-b border-line py-7 sm:grid-cols-[55px_150px_1fr] sm:gap-3"><span className="font-mono text-xs text-sky">{number}</span><h3 className="font-bold">{title}</h3><p className="col-start-2 text-sm leading-6 text-muted sm:col-start-auto">{body}</p></li>)}</ol></div></section>
      <section className="bg-ink-panel py-16 text-white md:py-24"><div className="container-shell grid gap-12 md:grid-cols-2"><div><p className="eyebrow text-sky-light">SEGMENTATION OUTPUT</p><h2 className="display mt-3 text-4xl">What a mask means</h2><p className="mt-5 leading-7 text-on-dark">Masks encode a binary cloud-versus-sky decision in the frame’s coordinate system. The overlay is a view composited in the browser; the mask is the analysis-ready artifact.</p></div><div className="grid grid-cols-2 gap-3 sm:gap-5">{[["white", "Cloud pixel"], ["black", "Sky pixel"], ["640×360", "Mask dimensions"], ["JPEG", "As delivered"]].map(([value, label]) => <div key={label} className="border border-white/15 p-4 sm:p-5"><strong className="display text-3xl text-lime">{value}</strong><p className="mt-2 text-xs leading-5 text-on-dark">{label}</p></div>)}</div></div></section>
      <section className="container-shell grid gap-12 py-16 md:grid-cols-3 md:py-24"><div><p className="eyebrow text-sky">REPRODUCIBILITY</p><h2 className="display mt-3 text-4xl">The release is the unit of record.</h2></div><div className="md:col-span-2 grid gap-8 sm:grid-cols-2">{["Published releases are never changed in place.", "Every file is listed in a manifest with a SHA-256 checksum.", "Collection-specific metadata is namespaced without hiding normalized fields.", "Corrections create a new version; earlier versions stay downloadable."].map((item) => <div key={item} className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-sky" /><p className="text-sm leading-6 text-muted">{item}</p></div>)}</div></section>
      <section className="border-t border-line bg-paper py-14"><div className="container-shell flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="eyebrow text-sky">PUT THE METHOD TO WORK</p><h2 className="display mt-2 text-3xl">Inspect an image and its artifacts.</h2></div><Link href="/explore" className="button-primary">Explore the archive <ArrowRight size={16} /></Link></div></section>
    </>
  );
}
