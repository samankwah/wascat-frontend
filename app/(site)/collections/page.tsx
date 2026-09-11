import type { Metadata } from "next";
import { connection } from "next/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CollectionCard } from "@/components/collection-card";
import { getCollections } from "@/lib/api-client";

export const metadata: Metadata = { title: "Collections", description: "All-sky capture sequences, each with its segmented frames and measured cloud cover." };


export default async function CollectionsPage() {
  // Render at request time rather than at build. Prerendering these would
  // make `next build` require a reachable database, coupling CI and the
  // container build to the API. The fetch data cache still applies, so this
  // costs a render and not a round trip.
  await connection();

  const collections = await getCollections();

  return (
    <>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
      <section className="bg-ink-panel py-16 text-white md:py-24">
        <div className="container-shell grid gap-8 md:grid-cols-[1.15fr_.85fr] md:items-end"><div><p className="eyebrow text-sky-light">CAPTURE SEQUENCES</p><h1 className="display mt-4 text-5xl md:text-7xl">{collections.length} sequences, one measured archive.</h1></div><p className="max-w-lg leading-7 text-on-dark">Each collection is a continuous all-sky capture sequence. Segmented frames keep their cloud mask and its measured cloud cover; every file carries a checksum.</p></div>
      </section>
      <section className="container-shell py-16 md:py-24">
        <div className="grid gap-14 md:grid-cols-3 md:gap-7">{collections.map((collection) => <CollectionCard collection={collection} key={collection.slug} />)}</div>
      </section>
      <section className="border-t border-line bg-sky-pale py-12"><div className="container-shell grid gap-5 md:grid-cols-[1fr_2fr]"><p className="eyebrow text-sky">RELEASE POLICY</p><p className="max-w-3xl text-sm leading-6 text-muted">Published data is immutable. When processing or metadata changes, maintainers issue a new numbered release and retain earlier releases for reproducibility. One release is marked current for convenience.</p></div></section>
    </>
  );
}
