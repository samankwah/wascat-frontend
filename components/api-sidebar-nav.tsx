"use client";

import { useEffect, useState } from "react";

const sections = [
  ["quickstart", "Quickstart"],
  ["endpoints", "Endpoints"],
  ["filters", "Filters"],
  ["envelope", "Response envelope"],
  ["limits", "Limits & caching"],
] as const;

/**
 * The API docs page's sticky section nav. Highlights whichever section is
 * currently under the (fixed-height) reading position near the top of the
 * viewport, tracked with an IntersectionObserver rather than a scroll
 * listener - the same approach `components/header.tsx` uses for its own
 * scrolled-state sentinel.
 *
 * `rootMargin`'s top offset clears the sticky header (see `scroll-padding-top`
 * in globals.css, which offsets the same header for the anchor jump itself);
 * the bottom offset narrows the detection band to the upper portion of the
 * viewport, so the *next* section only takes over once it has actually
 * reached that band, not the instant it enters the bottom of the screen.
 */
export function ApiSidebarNav() {
  const [active, setActive] = useState<string>(sections[0][0]);

  useEffect(() => {
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Sections are listed top to bottom; the last one still visible in
        // the detection band is the one the reader has scrolled to.
        const current = sections.map(([id]) => id).filter((id) => visible.has(id)).pop();
        if (current) setActive(current);
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 },
    );

    for (const [id] of sections) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="API sections" className="sticky top-6 border-l border-line text-xs">
      {sections.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          aria-current={active === id ? "location" : undefined}
          className={`block border-l-2 px-4 py-2 transition-colors ${
            active === id ? "border-sky font-bold text-sky" : "border-transparent text-muted hover:text-sky"
          }`}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
