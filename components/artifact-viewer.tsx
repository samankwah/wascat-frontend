"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageRecord } from "@/lib/catalog";

const tabs = ["Source", "Mask", "Overlay"] as const;

export function ArtifactViewer({ record }: { record: ImageRecord }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overlay");
  const [opacity, setOpacity] = useState(58);
  return (
    <div>
      <div className="flex border-b border-white/20" role="tablist" aria-label="Image artifacts">
        {tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`min-h-12 border-b-2 px-5 text-xs font-bold ${tab === item ? "border-[#d9ee9d] text-white" : "border-transparent text-white/55 hover:text-white"}`}>{item}</button>)}
      </div>
      <div className="relative mt-5 aspect-[4/3] overflow-hidden bg-[#071c27]" role="tabpanel" aria-label={`${tab} view`}>
        {tab !== "Mask" && <Image src={record.image} alt={record.alt} fill priority sizes="(max-width: 1024px) 100vw, 70vw" className="object-contain" />}
        {tab === "Mask" && <div className="absolute inset-0 bg-[#081923]"><div className="artifact-mask absolute inset-0 opacity-90" /></div>}
        {tab === "Overlay" && <div className="artifact-mask absolute inset-0" style={{ opacity: opacity / 100 }} aria-hidden="true" />}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10 text-[.6rem] font-bold tracking-wide text-white/80"><span>{record.width} × {record.height} PX</span><span>{tab.toUpperCase()} · v{record.release}</span></div>
      </div>
      {tab === "Overlay" && <label className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><span className="eyebrow min-w-28 text-white/60">Mask opacity</span><input aria-label="Mask opacity" type="range" min="0" max="100" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} className="w-full accent-[#d9ee9d]" /><output className="w-10 text-right font-mono text-xs text-white">{opacity}%</output></label>}
    </div>
  );
}
