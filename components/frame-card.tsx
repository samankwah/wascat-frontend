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
  const unsegmented = image.cloudCoverOktas == null;
  const meta = [recordTimestamp(image), image.location, image.skyClass].filter(Boolean).join(" · ");

  return (
    <article className="group h-full overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_8px_rgba(27,73,103,.06)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-light hover:shadow-[0_12px_28px_rgba(16,47,65,.12)] focus-within:border-sky-light focus-within:shadow-[0_12px_28px_rgba(16,47,65,.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={`/images/${image.id}`} className="flex h-full flex-col">
        <div className="image-zoom relative aspect-[16/9] bg-line-soft">
          <Image
            src={image.image}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 40vw, 28vw"
            className="object-cover"
            priority={priority}
          />
          <div className="absolute left-2 top-2 flex gap-1 sm:left-3 sm:top-3">
            {image.hasSource && (
              <span className="rounded-full bg-ink-abyss/80 px-2 py-0.5 text-[.6rem] font-semibold uppercase tracking-wider text-white ring-1 ring-white/20 backdrop-blur-sm sm:text-[.65rem]">Source</span>
            )}
            {image.hasMask && (
              <span className="rounded-full bg-lime px-2 py-0.5 text-[.6rem] font-semibold uppercase tracking-wider text-lime-ink sm:text-[.65rem]">Mask</span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col items-start gap-2 p-3 sm:flex-row sm:justify-between sm:gap-3 sm:p-4">
          <div className="min-w-0">
            <h2 className="break-all font-mono text-[.68rem] font-semibold tracking-tight text-ink sm:text-[.78rem]">{image.id}</h2>
            {meta && <p className="mt-1 text-[.73rem] leading-4 text-muted sm:text-xs">{meta}</p>}
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[.6rem] font-semibold uppercase tracking-wide sm:text-[.65rem] ${
              unsegmented ? "border border-dashed border-field text-muted" : "bg-sky-pale text-sky-dark"
            }`}
          >
            {image.cloudCoverOktas == null ? "Unsegmented" : oktaLabel(image.cloudCoverOktas)}
          </span>
        </div>
      </Link>
    </article>
  );
}
