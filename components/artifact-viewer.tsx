"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageRecord } from "@/lib/types";
import { oktaLabel } from "@/lib/vocab";

type Tab = "Source" | "Mask" | "Overlay";

export function ArtifactViewer({ record }: { record: ImageRecord }) {
  // A record holds the source frame, the mask, or both, so the tabs offered are
  // exactly the views its files can support. Overlay needs the pair.
  const tabs: Tab[] = [
    ...(record.hasSource ? (["Source"] as const) : []),
    ...(record.hasMask ? (["Mask"] as const) : []),
    ...(record.hasSource && record.hasMask ? (["Overlay"] as const) : []),
  ];
  // The richest view available: Overlay when paired, otherwise the only view there is.
  const [tab, setTab] = useState<Tab>(tabs[tabs.length - 1]);
  const [opacity, setOpacity] = useState(58);

  /**
   * Masks delivered at a larger scale than their frame are scaled back here, so
   * the overlay lines up with the sky it describes. `maskScale` is 1 for every
   * correctly registered sequence, making this a no-op.
   */
  const maskTransform = record.maskScale === 1 ? undefined : `scale(${1 / record.maskScale})`;

  return (
    <div>
      <div className="flex border-b border-white/20" role="tablist" aria-label="Image artifacts">
        {tabs.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`min-h-12 border-b-2 px-5 text-xs font-bold ${tab === item ? "border-[#d9ee9d] text-white" : "border-transparent text-white/55 hover:text-white"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="relative mt-5 aspect-[16/9] overflow-hidden bg-[#071c27]" role="tabpanel" aria-label={`${tab} view`}>
        {/* The source frame sits underneath for Source and Overlay. */}
        {tab !== "Mask" && record.sourceUrl && (
          <Image src={record.sourceUrl} alt={record.alt} fill priority sizes="(max-width: 1024px) 100vw, 70vw" className="object-contain" />
        )}

        {/* The mask is a real delivered file in both Mask and Overlay views. */}
        {tab === "Mask" && record.maskUrl && (
          <Image src={record.maskUrl} alt={`Binary cloud mask for ${record.id}`} fill priority sizes="(max-width: 1024px) 100vw, 70vw" className="object-contain" style={{ transform: maskTransform }} />
        )}
        {tab === "Overlay" && record.maskUrl && (
          <Image
            src={record.maskUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 1024px) 100vw, 70vw"
            // `screen` lets the white cloud show while the black sky drops out.
            className="object-contain mix-blend-screen"
            style={{ opacity: opacity / 100, transform: maskTransform }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10 text-[.6rem] font-bold tracking-wide text-white/80">
          <span>{record.width} × {record.height} PX</span>
          <span>{tab.toUpperCase()} · {record.cloudCoverOktas == null ? "NOT SEGMENTED" : oktaLabel(record.cloudCoverOktas)}</span>
        </div>
      </div>

      {tab === "Overlay" && (
        <label className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="eyebrow min-w-28 text-white/60">Mask opacity</span>
          <input aria-label="Mask opacity" type="range" min="0" max="100" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} className="w-full accent-[#d9ee9d]" />
          <output className="w-10 text-right font-mono text-xs text-white">{opacity}%</output>
        </label>
      )}

      {!record.hasSource && (
        <p className="mt-5 text-xs leading-5 text-white/60">
          The source frame for this record was not part of the delivered set, so only the segmentation mask is available.
        </p>
      )}
      {!record.hasMask && (
        <p className="mt-5 text-xs leading-5 text-white/60">
          This frame has not been segmented, so there is no cloud mask to overlay and no measured cloud cover. It is
          catalogued as delivered imagery.
        </p>
      )}
    </div>
  );
}
