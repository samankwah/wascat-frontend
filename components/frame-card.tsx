import Image from "next/image";
import Link from "next/link";
import { recordTimestamp } from "@/lib/format";
import type { ImageRecord } from "@/lib/types";
import { oktaLabel } from "@/lib/vocab";

/**
 * One catalogue record in a grid. Badges reflect what the record actually
 * carries -- the source frame, the mask, or both -- and the cloud-cover chip is
 * replaced by "unsegmented" where there is no mask to measure.
 */
export function FrameCard({ image, priority = false }: { image: ImageRecord; priority?: boolean }) {
  return (
    <article className="group">
      <Link href={`/images/${image.id}`}>
        <div className="image-zoom relative aspect-[16/9] bg-[#dbe7ec]">
          <Image
            src={image.image}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 30vw"
            className="object-cover"
            priority={priority}
          />
          <div className="absolute left-3 top-3 flex gap-1">
            {image.hasSource && <span className="bg-[#102433]/85 px-2 py-1 text-[.6rem] font-bold tracking-wide text-white">SOURCE</span>}
            {image.hasMask && <span className="bg-[#d9ee9d] px-2 py-1 text-[.6rem] font-bold tracking-wide text-[#24331a]">MASK</span>}
          </div>
        </div>
        <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h2 className="break-all font-mono text-[.68rem] font-bold tracking-tight sm:text-[.78rem]">{image.id}</h2>
            <p className="mt-1 text-[.68rem] leading-4 text-muted sm:text-xs">
              {recordTimestamp(image)}
              {image.location ? ` · ${image.location}` : ""}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-1 text-[.55rem] font-bold uppercase sm:text-[.6rem] ${
              image.cloudCoverOktas === undefined ? "border-dashed border-[#b8c8d1] text-muted" : "border-[#b8c8d1]"
            }`}
          >
            {image.cloudCoverOktas == null ? "Unsegmented" : oktaLabel(image.cloudCoverOktas)}
          </span>
        </div>
      </Link>
    </article>
  );
}
