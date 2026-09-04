import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Partner } from "@/lib/partners";

/**
 * Partner acknowledgements.
 *
 * This started as an auto-rotating slider and was rebuilt after checking
 * what that actually costs: Nielsen Norman Group's research puts first-slide
 * engagement on auto-rotating carousels around 1%, falling from there, and
 * WCAG 2.2.2 requires any motion running longer than five seconds to be
 * pausable *without* relying on hover - which a touch screen cannot do in
 * the first place. None of that trade bought anything here, because three
 * logos already fit in one glance - the exact case the accessibility
 * write-ups on this pattern point at as "just show them."
 *
 * So above the point where three cards fit a row, they are simply a static
 * row - nothing to click, nothing timed, nothing to lose focus of. Below
 * that width the row becomes a native horizontally-scrolling strip: no
 * custom carousel logic, no ARIA to get wrong, no timer to fight - a
 * scrollbar and touch scrolling do the whole job, and every card is still a
 * plain link a keyboard or screen reader reaches by tabbing through it like
 * any other content. The slight card peeking in from the right edge on
 * mobile is the same "there's more" cue a horizontally-scrolling list uses
 * anywhere else on the web.
 */
export function PartnerCarousel({ partners }: { partners: readonly Partner[] }) {
  return (
    <ul
      className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-3 sm:mx-0 sm:px-0 sm:pb-0 md:grid md:grid-cols-3 md:overflow-visible"
      aria-label="WASCAT partners"
    >
      {partners.map((partner) => (
        <li key={partner.shortName} className="w-[82%] shrink-0 snap-start sm:w-[55%] md:w-auto">
          <Link
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col border border-line bg-white p-6 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-on-dark hover:shadow-[0_14px_34px_rgba(16,47,65,.11)] sm:p-7"
          >
            <div className="relative h-24 bg-paper sm:h-28">
              <Image
                src={partner.logo.src}
                alt={partner.logo.alt}
                fill
                sizes="(max-width: 767px) 60vw, 260px"
                className="object-contain p-5"
              />
            </div>
            <p className="eyebrow mt-6 text-sky">{partner.shortName}</p>
            <h3 className="display mt-2 text-xl leading-tight">{partner.name}</h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted">{partner.description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky">
              Visit site
              <ExternalLink
                size={13}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
