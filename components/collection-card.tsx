import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Cloud } from "lucide-react";
import { cloudTypeInfo } from "@/lib/cloud-types";
import type { Collection, CollectionSummary } from "@/lib/types";
import { oktaTerm } from "@/lib/vocab";

/**
 * A collection card.
 *
 * The listing endpoint replaces the release history with just the current
 * release, while the detail endpoint returns the whole history. The card is
 * rendered from both, so it reads whichever the payload carries.
 *
 * Shows only what actually differs from one collection to the next - frame
 * count, segmented share, measured cloud cover - rather than the catalogue's
 * generated description sentence, which is near-identical across every
 * collection and just restates these same three numbers in prose. That
 * description still has its place as the one paragraph on the collection's
 * own page; repeated across a grid of cards it was noise, not content.
 *
 * A collection named after a cloud type also shows what that type is - its
 * level, a line on its appearance and the weather it goes with - which does
 * differ from card to card.
 */
export function CollectionCard({
  collection,
  priority = false,
}: {
  collection: Collection | CollectionSummary;
  priority?: boolean;
}) {
  const segmentedShare = collection.images > 0 ? Math.round((collection.segmented / collection.images) * 100) : 0;
  // Absent, not zero, when nothing has been measured yet - see the archive's
  // core rule that an unmeasured value is never assumed to be clear sky.
  const meanOktas = collection.meanCloudCoverOktas != null ? Math.round(collection.meanCloudCoverOktas) : null;
  const cloud = cloudTypeInfo(collection.title);

  return (
    <article className="group h-full overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_24px_rgba(16,47,65,.07)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-on-dark hover:shadow-[0_14px_34px_rgba(16,47,65,.13)] focus-within:-translate-y-1 focus-within:shadow-[0_14px_34px_rgba(16,47,65,.13)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={`/collections/${collection.slug}`} className="flex h-full flex-col">
        <div className="image-zoom relative aspect-[16/9] bg-line-soft">
          <Image src={collection.image} alt={collection.imageAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" priority={priority} />
          {cloud ? (
            <span className="absolute left-3 top-3 rounded-full bg-ink/75 px-2.5 py-1 text-[.7rem] font-semibold uppercase tracking-wider text-sky-light ring-1 ring-sky-light/40 backdrop-blur-sm">
              {cloud.level} ({cloud.heights})
            </span>
          ) : null}
          <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight size={18} aria-hidden /></span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="eyebrow text-muted-soft">{collection.kicker}</p>
          <h3 className="display mt-2 text-[1.7rem] leading-tight">{collection.title}</h3>
          {cloud ? (
            <>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{cloud.description}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-soft"><Cloud size={13} aria-hidden /> {cloud.weather}</p>
            </>
          ) : null}
          {/* Pinned to the bottom so the stats line up across a row of cards
              whose descriptions run to different lengths. */}
          <div className="mt-auto pt-4">
            <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs">
              <span><b>{collection.images.toLocaleString()}</b> frames</span>
              <span><b>{segmentedShare}%</b> segmented</span>
              {meanOktas != null ? <span><b>{meanOktas}/8</b> {oktaTerm(meanOktas).toLowerCase()}</span> : null}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** The level a cloud type forms at, and its height band. */
export function CloudLevelBadge({ level, heights, className = "" }: { level: string; heights: string; className?: string }) {
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-full border border-sky/40 px-2.5 py-0.5 text-[.7rem] font-semibold uppercase tracking-wider text-sky ${className}`}>
      {level} ({heights})
    </span>
  );
}
