"use client";

import Image from "next/image";
import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { GroundViewLightbox } from "@/components/ground-view-lightbox";
import type { GroundView } from "@/lib/ground-views";

/**
 * A photograph's page's main image: the photograph large, opening full size
 * on click, where the arrows step through the others of the same kind.
 */
export function GroundViewPhoto({
  view,
  group,
  place,
  placeFacts,
}: {
  view: GroundView;
  /** The photographs the full-size view steps through; `view` must be one of them. */
  group: readonly GroundView[];
  place: string;
  placeFacts?: readonly (readonly [string, string])[];
}) {
  const [viewing, setViewing] = useState<number | null>(null);
  const index = Math.max(0, group.findIndex((entry) => entry.src === view.src));

  return (
    <>
      <button
        type="button"
        onClick={() => setViewing(index)}
        aria-label={`View ${view.clouds.join(" and ")} full size`}
        className="group relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-xl bg-paper"
      >
        <Image
          src={view.src}
          alt={`${view.clouds.join(" and ")} over ${place}, photographed from the ground.`}
          fill
          sizes="(max-width: 1024px) 100vw, 480px"
          loading="eager"
          fetchPriority="high"
          className="object-cover object-[center_25%]"
        />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-[0_2px_10px_rgba(16,47,65,.15)] backdrop-blur-sm transition-colors group-hover:bg-white">
          <Maximize2 size={13} aria-hidden="true" />
          Full size
        </span>
      </button>

      <GroundViewLightbox
        views={group}
        index={viewing}
        place={place}
        placeFacts={placeFacts}
        onChange={setViewing}
        onClose={() => setViewing(null)}
      />
    </>
  );
}
