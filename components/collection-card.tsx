import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Collection } from "@/lib/catalog";

export function CollectionCard({ collection, priority = false }: { collection: Collection; priority?: boolean }) {
  return (
    <article className="group border-t border-[#9fb2bd] pt-3">
      <Link href={`/collections/${collection.slug}`} className="block">
        <div className="image-zoom relative aspect-[16/9] bg-[#dbe7ec]">
          <Image src={collection.image} alt={collection.imageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" priority={priority} />
          <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight size={18} /></span>
        </div>
        <p className="eyebrow mt-5 text-[#607584]">{collection.kicker}</p>
        <h3 className="display mt-2 text-[1.7rem] leading-tight">{collection.title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted">{collection.description}</p>
        <div className="mt-5 flex gap-5 border-t border-[#d7e2e9] pt-3 text-xs">
          <span><b>{collection.images.toLocaleString()}</b> frames</span>
          <span><b>{collection.segmented.toLocaleString()}</b> segmented</span>
          <span><b>v{collection.releases[0].version}</b> current</span>
        </div>
      </Link>
    </article>
  );
}
