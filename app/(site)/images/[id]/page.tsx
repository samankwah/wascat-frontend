import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownToLine, Box, Camera, Cloud, Clock3, CloudOff, CloudSun, ExternalLink, FileJson2, Film, MapPin } from "lucide-react";
import { ArtifactViewer } from "@/components/artifact-viewer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CopyButton } from "@/components/copy-button";
import { FrameCard } from "@/components/frame-card";
import { getCollection, getCollectionImages, getImage } from "@/lib/api-client";
import { formatDate, sequenceLabel } from "@/lib/format";
import { oktaLabel } from "@/lib/vocab";

// Detail pages render on demand: there are too many records to pre-render, and
// `dynamicParams` defaults to true so any valid id is served.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const record = await getImage((await params).id);
  return { title: record?.id ?? "Image record", description: record?.alt };
}

export default async function ImageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Render at request time rather than at build. Prerendering these would
  // make `next build` require a reachable database, coupling CI and the
  // container build to the API. The fetch data cache still applies, so this
  // costs a render and not a round trip.
  await connection();

  const record = await getImage((await params).id);
  if (!record) notFound();
  const apiUrl = `https://wascat.example.org/api/v1/images/${record.id}`;
  // Four are requested so three survive filtering this record out.
  const [neighbours, collection] = await Promise.all([
    getCollectionImages(record.collection, { limit: 4 }),
    getCollection(record.collection),
  ]);
  const related = neighbours.filter((item) => item.id !== record.id).slice(0, 3);

  // Facts are measured or omitted; nothing here is assigned by hand.
  const facts: [typeof Clock3, string, string][] = [
    [Film, "Sequence", `${sequenceLabel(record.sequenceId)} · frame ${record.frameIndex.toLocaleString()}`],
    record.cloudFraction == null
      ? [CloudOff, "Cloud cover", "Not measured — this frame has no segmentation mask"]
      : [CloudSun, "Measured cloud cover", `${oktaLabel(record.cloudCoverOktas ?? 0)} · ${(record.cloudFraction * 100).toFixed(1)}% of the field of view`],
    [Box, "Dimensions", `${record.width} × ${record.height} pixels`],
    ...(record.capturedAt ? [[Clock3, "Captured", formatDate(record.capturedAt, true)] as [typeof Clock3, string, string]] : []),
    ...(record.location ? [[MapPin, "Location", record.location] as [typeof Clock3, string, string]] : []),
    ...(record.skyClass ? [[Cloud, "Sky class", record.skyClass] as [typeof Clock3, string, string]] : []),
    ...(record.instrument ? [[Camera, "Instrument", record.instrument] as [typeof Clock3, string, string]] : []),
  ];

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          { label: collection?.shortTitle ?? record.collection, href: `/collections/${record.collection}` },
          { label: record.id, mono: true },
        ]}
      />
      <section className="bg-ink-deep text-white">
        <div className="container-shell grid gap-9 pb-14 lg:grid-cols-[1.45fr_.55fr] lg:pb-20">
          <ArtifactViewer record={record} />
          <aside className="lg:pt-12">
            <p className="eyebrow text-sky-light">
              {record.hasSource && record.hasMask ? "SOURCE + MASK" : record.hasMask ? "MASK ONLY" : "SOURCE ONLY"}
            </p>
            <h1 className="mt-3 break-all font-mono text-xl font-bold leading-7">{record.id}</h1>
            <p className="mt-3 text-sm text-white/65">{collection?.shortTitle ?? record.collection} · release {record.release}</p>
            <div className="mt-8 grid border-t border-white/20">
              {facts.map(([Icon, label, body]) => {
                const Graphic = Icon;
                return (
                  <div key={label} className="grid grid-cols-[24px_1fr] gap-3 border-b border-white/15 py-4">
                    <Graphic size={16} className="text-sky-light" />
                    <div>
                      <p className="eyebrow text-white/45">{label}</p>
                      <p className="mt-1 text-xs leading-5">{body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href={`/collections/${record.collection}`} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-sky-light">
              View sequence <ExternalLink size={13} />
            </Link>
          </aside>
        </div>
      </section>

      <section className="container-shell grid gap-12 py-14 md:grid-cols-[1.25fr_.75fr] md:py-20">
        <div className="min-w-0">
          <p className="eyebrow text-sky">AVAILABLE FILES</p>
          <h2 className="display mt-3 text-4xl">Download artifacts</h2>
          <div className="mt-7 border-t border-line-strong">
            {record.artifacts.map((artifact) => (
              <div key={artifact.type} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_110px_160px_auto] sm:gap-5">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{artifact.type === "source" ? "Source frame" : "Segmentation mask"}</p>
                  {/* The real stored path, not a synthesised filename. */}
                  <p className="mt-1 break-all font-mono text-[.64rem] text-muted">{artifact.objectKey}</p>
                </div>
                <span className="hidden text-xs text-muted sm:block">{(artifact.bytes / 1024).toFixed(0)} KB</span>
                <span className="hidden font-mono text-[.62rem] text-muted sm:block">SHA-256 {artifact.checksum.slice(0, 10)}…</span>
                <a href={artifact.url} download className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong hover:border-sky hover:text-sky" aria-label={`Download ${artifact.type}`}>
                  <ArrowDownToLine size={16} />
                </a>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="eyebrow text-muted">
              {record.cloudFraction === undefined ? "WHY THIS RECORD HAS NO MEASUREMENT" : "HOW THIS RECORD WAS MEASURED"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {record.cloudFraction === undefined ? (
                <>
                  Cloud cover is measured from the binary segmentation mask, and this frame has not been segmented, so no
                  cover is reported for it. Estimating one from the photograph alone would be a guess, so the field is left
                  empty and the frame is excluded from cloud-cover filters. It is one of a sample drawn evenly across{" "}
                  sequence {sequenceLabel(record.sequenceId)}{" "}
                  so the unsegmented part of the sequence is visible rather than hidden.
                </>
              ) : (
                <>
                  Cloud cover is the share of the camera&apos;s circular field of view that the binary mask marks as cloud:{" "}
                  <strong>{((record.cloudFraction ?? 0) * 100).toFixed(1)}%</strong>, or {oktaLabel(record.cloudCoverOktas ?? 0)}. The
                  field of view is taken from the corner-masked frame itself rather than assumed.
                  {record.maskScale !== 1 && (
                    <> This sequence&apos;s masks were delivered at {record.maskScale.toFixed(4)}× the scale of the frames
                    they segment; the mask is served exactly as delivered and scaled back for measurement and display.</>
                  )}
                </>
              )}
              {" "}Files are immutable within release {record.release}.
            </p>
          </div>
        </div>
        <aside className="min-w-0 space-y-5">
          <div className="border border-line bg-paper p-5">
            <div className="flex items-center gap-2"><FileJson2 size={18} className="text-sky" /><h2 className="font-bold">Use this record in code</h2></div>
            <div className="mt-4 overflow-x-auto bg-ink p-4 font-mono text-[.68rem] leading-5 text-sky-mist"><code className="whitespace-nowrap">curl {apiUrl}</code></div>
            <div className="mt-4"><CopyButton value={apiUrl} label="Copy API URL" /></div>
          </div>
          <div className="border border-line p-5">
            <p className="eyebrow text-muted">STABLE REFERENCE</p>
            <p className="mt-3 break-all font-mono text-[.68rem] leading-5">wascat:{record.collection}:{record.release}:{record.id}</p>
            <p className="mt-3 text-xs leading-5 text-muted">Use the stable identifier and release when testing integrations so this exact record can be recovered.</p>
          </div>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-paper py-16">
          <div className="container-shell">
            <div className="flex items-end justify-between gap-4">
              <div><p className="eyebrow text-sky">NEARBY IN THE SEQUENCE</p><h2 className="display mt-3 text-4xl">Adjacent frames</h2></div>
              <Link href={`/explore?collection=${record.collection}`} className="shrink-0 text-xs font-bold text-sky">View all →</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-5">
              {related.map((item) => <FrameCard key={item.id} image={item} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
