"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageItems } from "@/lib/pagination";

/** One row at full width. */
const PAGE_SIZE = 5;

export type Thumbnail = {
  href: string;
  src: string;
  alt: string;
  caption?: string;
  /** A caption that names the photograph rather than adding to a heading that already does. */
  captionLeads?: boolean;
};

/**
 * Other photographs as a grid, a row at a time once there are more than a
 * row's worth. Paging happens in place, so the page itself stays static and
 * the reader keeps their place on it; the range shown is announced.
 */
export function GroundViewThumbnails({ items, label }: { items: readonly Thumbnail[]; label: string }) {
  const [page, setPage] = useState(1);
  const pages = Math.ceil(items.length / PAGE_SIZE);
  const first = (page - 1) * PAGE_SIZE;
  const shown = items.slice(first, first + PAGE_SIZE);

  return (
    <div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {shown.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group block">
              <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-ink-abyss">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                  className="object-cover object-[center_25%] transition-opacity group-hover:opacity-90 motion-reduce:transition-none"
                />
              </span>
              {item.caption ? (
                <span className={`mt-2.5 block text-sm ${item.captionLeads ? "font-semibold text-ink group-hover:text-sky" : "text-muted"}`}>
                  {item.caption}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav aria-label={`${label}, pages`} className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="tabular text-sm text-muted" aria-live="polite">
            <span className="text-ink">
              {first + 1}–{first + shown.length}
            </span>{" "}
            of {items.length}
          </p>

          <div className="flex items-center gap-1">
            <PageButton label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} aria-hidden="true" />
            </PageButton>
            {pageItems(page, pages).map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`} aria-hidden="true" className="px-1 font-mono text-sm text-muted-dim">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={`tabular grid size-9 place-items-center rounded-full font-mono text-sm transition-colors motion-reduce:transition-none ${
                    item === page ? "bg-ink text-white" : "text-ink hover:bg-white hover:ring-1 hover:ring-line-strong"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
            <PageButton label="Next page" disabled={page === pages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} aria-hidden="true" />
            </PageButton>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-white hover:ring-1 hover:ring-line-strong disabled:pointer-events-none disabled:text-line-strong motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}
