import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * One level of a page's breadcrumb trail. The last entry in a trail is
 * always rendered as the current page - a plain, non-link span marked
 * `aria-current="page"` - regardless of whether it carries an `href`.
 */
export type Crumb = { label: string; href?: string; mono?: boolean };

/**
 * A page's position in the site hierarchy, and the tap targets to climb
 * back out of it - Home first, then each ancestor section, then the
 * current page. Rendered as a neutral bar above the page's own (variably
 * coloured) hero section, so this needs only one visual style.
 *
 * The row scrolls horizontally rather than wrapping, so a long trail (or a
 * long mono record id as the last crumb) never breaks onto a second line.
 *
 * Mobile/tablet only: desktop already has the full header nav for
 * wayfinding, so this is hidden at `lg` and up.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-line bg-paper lg:hidden">
      <div className="container-shell overflow-x-auto whitespace-nowrap py-3">
        <ol className="inline-flex items-center gap-1.5 text-xs font-bold">
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={index} className="inline-flex shrink-0 items-center gap-1.5">
                {index > 0 && <ChevronRight size={13} aria-hidden="true" className="shrink-0 text-muted" />}
                {!isLast && crumb.href ? (
                  <Link href={crumb.href} className="shrink-0 text-muted hover:text-sky">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className={`shrink-0 text-ink ${crumb.mono ? "font-mono" : ""}`}>
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
