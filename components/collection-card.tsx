import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

  return (
    <article className="group border-t border-line-strong pt-3">
      <Link href={`/collections/${collection.slug}`} className="block">
        <div className="image-zoom relative aspect-[16/9] bg-line-soft">
          <Image src={collection.image} alt={collection.imageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" priority={priority} />
          <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight size={18} /></span>
        </div>
        <p className="eyebrow mt-5 text-muted-soft">{collection.kicker}</p>
        <h3 className="display mt-2 text-[1.7rem] leading-tight">{collection.title}</h3>
        <div className="mt-4 flex gap-5 border-t border-line pt-3 text-xs">
          <span><b>{collection.images.toLocaleString()}</b> frames</span>
          <span><b>{segmentedShare}%</b> segmented</span>
          {meanOktas != null ? <span><b>{meanOktas}/8</b> {oktaTerm(meanOktas).toLowerCase()}</span> : null}
        </div>
      </Link>
    </article>
  );
}
