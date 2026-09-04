import type { Metadata } from "next";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Camera, CloudSun, ExternalLink, Film, MapPin, ShieldCheck } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { FrameCard } from "@/components/frame-card";
import { getCollection, getCollectionImages } from "@/lib/api-client";
import { formatDate, sequenceLabel } from "@/lib/format";
import { oktaLabel } from "@/lib/vocab";

// No generateStaticParams: pre-rendering these would make `next build` require
// a running database, which couples CI and the container build to the API for
// eleven pages. They are rendered on demand and cached, and a dashboard edit
// invalidates them through /api/revalidate.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const collection = await getCollection((await params).slug);
  return { title: collection?.title ?? "Collection", description: collection?.description };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  // Render at request time rather than at build. Prerendering these would
  // make `next build` require a reachable database, coupling CI and the
  // container build to the API. The fetch data cache still applies, so this
  // costs a render and not a round trip.
  await connection();

  const collection = await getCollection((await params).slug);
  if (!collection) notFound();
  const current = collection.releases.find((release) => release.current) ?? collection.releases[0];

  // Enough frames to fill the sample grid and find an unsegmented one, rather
  // than the whole sequence: the aggregates the page needs are computed by the
  // API, so there is no reason to ship hundreds of records to render four.
  const [segmentedSample, unsegmentedSample] = await Promise.all([
    getCollectionImages(collection.slug, { segmented: "true", limit: 3 }),
    getCollectionImages(collection.slug, { segmented: "false", limit: 1 }),
  ]);
  // Show what the sequence actually holds: mostly segmented frames, plus one of
  // the sampled unsegmented ones where there are any.
  // Show what the sequence actually holds: mostly segmented frames, plus one
  // of the sampled unsegmented ones where there are any.
  const samples = [...segmentedSample, ...unsegmentedSample].slice(0, 4);
  const metadataUrl = `/api/v1/images?collection=${collection.slug}&release=${current?.version ?? ""}&limit=100`;
  const citationValue = collection.citation
    ? collection.doi ? `${collection.citation} https://doi.org/${collection.doi}` : collection.citation
    : undefined;

  // Averaged by the database over the frames that actually carry a
  // measurement, rather than by walking the sequence here.
  const meanOktas = collection.meanCloudCoverOktas ?? 0;
  const segmentedCount = collection.segmented;
  const registered = collection.maskRegistration.filter((entry) => entry.corrected);

  // Only render facts we actually hold; a missing value is omitted, never filled in.
  const facts: [typeof MapPin, string, string][] = [
    [Film, "Sequences", collection.sequenceIds.map(sequenceLabel).join(", ")],
    [CloudSun, "Mean cloud cover", `${oktaLabel(Math.round(meanOktas))} · over ${segmentedCount.toLocaleString()} segmented frames`],
    ...(collection.location ? [[MapPin, "Location", collection.location] as [typeof MapPin, string, string]] : []),
    ...(collection.instrument ? [[Camera, "Instrument", collection.instrument] as [typeof MapPin, string, string]] : []),
    ...(collection.license ? [[ShieldCheck, "License", collection.license.replace(" International", "")] as [typeof MapPin, string, string]] : []),
  ];

  return (
    <>
      <section className="bg-paper">
        <div className="container-shell py-5"><Link href="/collections" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-sky"><ArrowLeft size={14} /> All collections</Link></div>
        <div className="container-shell grid gap-10 pb-14 md:grid-cols-[1.03fr_.97fr] md:items-end md:pb-20">
          <div className="pb-2">
            <p className="eyebrow text-sky">{collection.kicker}</p>
            <h1 className="display mt-4 text-5xl leading-[.98] md:text-7xl">{collection.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{collection.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={metadataUrl} download className="button-primary"><ArrowDownToLine size={17} /> Download metadata JSON</a>
              <Link href={`/explore?collection=${collection.slug}`} className="button-secondary">Explore frames <ArrowRight size={16} /></Link>
            </div>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden bg-line-soft">
            <Image src={collection.image} alt={collection.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="border-y border-line">
        <div className="container-shell grid grid-cols-2 md:grid-cols-4">
          {facts.map(([Icon, label, body], index) => {
            const Graphic = Icon;
            return (
              <div key={label} className={`min-h-36 border-line p-4 sm:p-5 ${index % 2 === 1 ? "border-l" : ""} ${index > 1 ? "border-t" : ""} md:border-l md:border-t-0 ${index === 0 ? "md:border-l-0" : ""}`}>
                <Graphic size={18} className="text-sky" />
                <p className="eyebrow mt-5 text-muted">{label}</p>
                <p className="mt-2 text-xs leading-5">{body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-shell grid gap-14 py-16 md:grid-cols-[1.45fr_.55fr] md:py-24">
        <div>
          <p className="eyebrow text-sky">SAMPLE FRAMES</p>
          <h2 className="display mt-3 text-4xl">Inside this sequence</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-5">
            {samples.map((sample) => <FrameCard key={sample.id} image={sample} />)}
          </div>
        </div>
        <aside>
          <p className="eyebrow text-sky">MEASURED TOTALS</p>
          <dl className="mt-4 border-t border-line-strong">
            {([
              [collection.images.toLocaleString(), "Catalogued frames"],
              [collection.segmented.toLocaleString(), "With cloud mask"],
              [collection.withSource.toLocaleString(), "With source frame"],
              [(collection.images - collection.segmented).toLocaleString(), "Not yet segmented"],
              [collection.artifacts.toLocaleString(), "Image files"],
              [current.size, "Total size"],
            ] as [string, string][]).map(([value, label]) => (
              <div key={label} className="flex items-end justify-between border-b border-line py-4">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="display text-2xl">{value}</dd>
              </div>
            ))}
          </dl>
          {registered.length > 0 && (
            <div className="mt-10 border border-line bg-paper p-5">
              <p className="eyebrow">Mask registration</p>
              <p className="mt-3 text-xs leading-5 text-muted">
                Masks for sequences {registered.map((entry) => sequenceLabel(entry.sequenceId)).join(", ")} were delivered at{" "}
                {registered[0].scale.toFixed(4)}× the scale of the frames they segment. They are served exactly as
                delivered; cloud cover is measured against the camera&apos;s true field of view, and the overlay is scaled
                back so the two line up.
              </p>
            </div>
          )}
        </aside>
      </section>

      {(citationValue || collection.license) && (
        <section className="container-shell grid gap-12 py-16 md:grid-cols-2 md:py-24">
          {citationValue && (
            <div>
              <p className="eyebrow text-sky">CITATION</p>
              <div className="mt-4 border-l-2 border-sky pl-5">
                <p className="display text-xl leading-8">{collection.citation}</p>
                {collection.doi && <p className="mt-3 font-mono text-xs text-muted">https://doi.org/{collection.doi}</p>}
                <div className="mt-4"><CopyButton value={citationValue} label="Copy citation" /></div>
              </div>
            </div>
          )}
          {collection.license && (
            <div>
              <p className="eyebrow text-sky">LICENSE</p>
              <h2 className="mt-4 font-bold">{collection.license}</h2>
              {collection.doi && (
                <a href={`https://doi.org/${collection.doi}`} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky">
                  Related publication <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
        </section>
      )}

      <section className="border-t border-line py-16">
        <div className="container-shell">
          <div className="flex items-center justify-between">
            <div><p className="eyebrow text-sky">RELEASE HISTORY</p><h2 className="display mt-3 text-4xl">Stable by version</h2></div>
            <span className="hidden rounded-full bg-lime px-3 py-1 text-xs font-bold sm:block">v{current.version} is current</span>
          </div>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong text-[.65rem] uppercase tracking-[.1em] text-muted">
                  <th className="py-3">Version</th><th>Published</th><th>Frames</th><th>Size</th><th></th>
                </tr>
              </thead>
              <tbody>
                {collection.releases.map((release) => (
                  <tr key={release.version} className="border-b border-line">
                    <td className="py-4 font-bold">v{release.version} {release.current && <span className="ml-2 rounded-full bg-lime px-2 py-1 text-[.6rem]">CURRENT</span>}</td>
                    <td>{release.publishedAt ? formatDate(release.publishedAt) : "—"}</td>
                    <td>{release.images.toLocaleString()}</td>
                    <td>{release.size}</td>
                    <td className="text-right"><a href={metadataUrl} download className="text-xs font-bold text-sky">Metadata</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
