import Image from "next/image";
import { connection } from "next/server";
import Link from "next/link";
import { ArrowRight, Check, Database, Image as ImageIcon, Layers3, MapPin, Search } from "lucide-react";
import { CollectionCard } from "@/components/collection-card";
import { getArchiveStats, getCollections } from "@/lib/api-client";
import { oktaValues } from "@/lib/vocab";

export default async function HomePage() {
  // Render at request time rather than at build. Prerendering these would
  // make `next build` require a reachable database, coupling CI and the
  // container build to the API. The fetch data cache still applies, so this
  // costs a render and not a round trip.
  await connection();

  const [stats, collections] = await Promise.all([getArchiveStats(), getCollections()]);
  const { total: archiveImageTotal, sequences: videoIds } = stats;

  return (
    <>
      <section className="relative border-b border-line bg-sky-wash" aria-labelledby="home-hero-title">
        <div className="relative lg:min-h-[560px]">
          <Image
            src="/images/kumasi-hero.png"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="hero-image hidden object-cover object-[center_94%] saturate-[1.06] lg:block"
          />
          <div className="ghana-hero-gradient absolute inset-0 hidden lg:block" />

          <div className="relative z-10 mx-auto w-[min(1174px,calc(100%-32px))] pt-11 sm:w-[min(1174px,calc(100%-64px))] sm:pt-14 lg:pt-[72px]">
            <div className="max-w-[570px]">
              <h1 id="home-hero-title" className="display text-[clamp(2.9rem,5vw,4.15rem)] leading-[1.01] text-ink">
                <span className="block">A visual record of</span>
                <span className="block">West African skies</span>
              </h1>
              <p className="mt-6 max-w-[410px] text-[1.02rem] leading-[1.62] text-ink-panel md:text-[1.08rem]">
                WASCAT v1.0 is an expert-labelled demonstration archive spanning Ghana, Nigeria, and Burkina Faso, built for transparent cloud, aerosol, and atmospheric-condition research.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:mt-2 sm:flex-row sm:gap-4">
                <Link href="/explore" className="hero-primary-link inline-flex min-h-12 items-center justify-center rounded-[7px] bg-sky-vivid px-9 text-sm font-bold transition-colors hover:bg-sky-bright sm:min-w-[178px]">Browse images</Link>
                <a href="/api/v1/images?limit=100" download="wascat-v1.0-metadata.json" className="hero-secondary-link inline-flex min-h-12 items-center justify-center rounded-[7px] border-2 border-sky-vivid bg-white/65 px-7 text-sm font-bold transition-colors hover:bg-white sm:min-w-[195px]">Download metadata</a>
              </div>
            </div>

            <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-sm bg-on-dark shadow-[0_12px_30px_rgba(19,65,91,.12)] md:aspect-[2/1] lg:hidden">
              <Image
                src="/images/kumasi-hero.png"
                alt="Bright cumulus clouds above the green urban skyline of Kumasi, Ghana."
                fill
                priority
                unoptimized
                sizes="(max-width: 1023px) calc(100vw - 32px), 1px"
                className="hero-image object-cover object-center saturate-[1.12]"
              />
            </div>
          </div>

          <form action="/explore" method="get" role="search" aria-label="Search the WASCAT image archive" className="relative z-20 mx-auto mt-8 grid w-[min(1128px,calc(100%-32px))] gap-4 rounded-xl bg-white px-5 py-5 shadow-[0_5px_13px_rgba(27,73,103,.18)] sm:w-[min(1128px,calc(100%-64px))] sm:grid-cols-2 sm:px-6 lg:absolute lg:bottom-[-40px] lg:left-1/2 lg:mt-0 lg:-translate-x-1/2 lg:grid-cols-[2.05fr_.95fr_.95fr_.95fr_1fr] lg:items-end lg:gap-5 lg:py-[22px]">
            <label className="relative block sm:col-span-2 lg:col-span-1">
              <span className="sr-only">Search by date, class, or condition</span>
              <Search size={24} strokeWidth={1.75} className="pointer-events-none absolute left-4 top-3.5 text-muted-dim" aria-hidden="true" />
              <input name="q" type="search" className="field-input hero-search-control search-field-input" placeholder="Search by date, class or condition" />
            </label>
            <label className="hero-filter-label"><span className="field-label text-muted-dim">Sequence</span><select name="video" className="field-select hero-search-control" defaultValue=""><option value="">All sequences</option>{videoIds.map((videoId) => <option key={videoId}>{videoId}</option>)}</select></label>
            <label className="hero-filter-label"><span className="field-label text-muted-dim">Min cloud cover</span><select name="oktasMin" className="field-select hero-search-control" defaultValue=""><option value="">Any</option>{oktaValues.map((okta) => <option key={okta} value={okta}>{okta}/8</option>)}</select></label>
            <label className="hero-filter-label"><span className="field-label text-muted-dim">Max cloud cover</span><select name="oktasMax" className="field-select hero-search-control" defaultValue=""><option value="">Any</option>{oktaValues.map((okta) => <option key={okta} value={okta}>{okta}/8</option>)}</select></label>
            <button type="submit" className="inline-flex h-[50px] items-center justify-center self-end whitespace-nowrap rounded-[7px] bg-sky-vivid px-5 text-sm font-bold text-white transition-colors hover:bg-sky-bright sm:col-span-2 lg:col-span-1">Explore archive</button>
          </form>
        </div>

        <div className="mx-auto grid w-[min(970px,calc(100%-32px))] gap-y-5 pb-7 pt-7 sm:w-[min(970px,calc(100%-80px))] sm:grid-cols-3 sm:pt-8 lg:pb-6 lg:pt-[62px]" aria-label="Archive statistics">
          <div className="flex min-h-[64px] items-center gap-5 sm:justify-start sm:pr-7">
            <ImageIcon size={43} strokeWidth={1.25} className="shrink-0 text-sky-vivid" aria-hidden="true" />
            <strong className="display text-[2rem] font-normal text-ink">{archiveImageTotal.toLocaleString()}</strong>
            <span className="text-[.66rem] font-bold uppercase tracking-[.14em] text-muted-dim">Images</span>
          </div>
          <div className="flex min-h-[64px] items-center gap-5 border-t border-on-dark pt-5 sm:justify-center sm:border-l sm:border-t-0 sm:px-7 sm:pt-0">
            <Layers3 size={43} strokeWidth={1.25} className="shrink-0 text-sky-vivid" aria-hidden="true" />
            <strong className="display text-[2rem] font-normal text-ink">{videoIds.length}</strong>
            <span className="text-[.66rem] font-bold uppercase tracking-[.14em] text-muted-dim">Sequences</span>
          </div>
          <div className="flex min-h-[64px] items-center gap-5 border-t border-on-dark pt-5 sm:justify-end sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
            <MapPin size={43} strokeWidth={1.25} className="shrink-0 text-sky-vivid" aria-hidden="true" />
            <strong className="display text-[1.55rem] font-normal text-ink md:text-[1.72rem]">West Africa</strong>
            <span className="sr-only">Region</span>
          </div>
        </div>
      </section>

      <section className="container-shell py-20 md:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><p className="eyebrow text-sky">CURATED FOR DISCOVERY</p><h2 className="display mt-3 max-w-xl text-4xl leading-tight md:text-5xl">Featured collections from the archive</h2></div>
          <Link href="/collections" className="flex items-center gap-2 text-sm font-bold text-sky">View all collections <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-6">{collections.map((collection, index) => <CollectionCard collection={collection} priority={index === 0} key={collection.slug} />)}</div>
      </section>

      <section className="bg-ink-panel py-20 text-white md:py-28">
        <div className="container-shell grid gap-14 lg:grid-cols-[.9fr_1.4fr] lg:gap-24">
          <div>
            <p className="eyebrow text-sky-light">MORE THAN A PHOTOGRAPH</p>
            <h2 className="display mt-4 text-4xl leading-tight md:text-5xl">Each image keeps its scientific context.</h2>
            <p className="mt-6 leading-7 text-on-dark">Source pixels stay connected to masks, overlays, capture conditions, provenance, and checksums. The result is data you can inspect and reproduce.</p>
            <Link href="/methods" className="mt-8 inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm font-bold">Learn about processing <ArrowRight size={15} /></Link>
          </div>
          <div className="grid gap-px bg-white/15 sm:grid-cols-3">
            {[
              [Database, "01", "Source", "Illustrative regional imagery, dimensions, and fixture capture metadata."],
              [Layers3, "02", "Artifacts", "Pixel masks, diagnostic overlays, labels, and future products."],
              [Check, "03", "Provenance", "Demonstration status, methods, versions, manifests, citations, and SHA-256 checksums."],
            ].map(([Icon, number, title, body]) => {
              const Graphic = Icon as typeof Database;
              return <div key={String(title)} className="bg-ink-panel p-7 sm:min-h-[280px]"><div className="flex items-center justify-between"><Graphic size={25} className="text-lime" /><span className="text-xs text-on-dark-dim">{String(number)}</span></div><h3 className="display mt-16 text-2xl">{String(title)}</h3><p className="mt-3 text-sm leading-6 text-field">{String(body)}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="container-shell grid gap-8 py-16 md:grid-cols-[1fr_auto] md:items-center md:py-20">
        <div><p className="eyebrow text-sky">READY TO WORK WITH WASCAT?</p><h2 className="display mt-3 text-4xl">Start with the images, or start with the API.</h2></div>
        <div className="flex flex-wrap gap-3"><Link href="/explore" className="button-primary">Browse archive <ArrowRight size={16} /></Link><Link href="/api-docs" className="button-secondary">Read API docs</Link></div>
      </section>
    </>
  );
}
