import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreCatalog } from "@/components/explore-catalog";

export const metadata: Metadata = { title: "Explore images", description: "Search expert-labelled WASCAT demonstration records from Ghana, Nigeria, and Burkina Faso." };

export default function ExplorePage() {
  return (
    <>
      <section className="border-b border-[#d7e2e9] bg-paper">
        <div className="container-shell py-12 md:py-16"><p className="eyebrow text-sky">WEST AFRICAN DEMONSTRATION CATALOG</p><h1 className="display mt-3 text-5xl md:text-6xl">Explore the archive</h1><p className="mt-4 max-w-2xl leading-7 text-muted">Search expert-labelled fixture records and processed cloud products represented across Kumasi, Lagos, and Ouagadougou. Every record belongs to a stable demonstration release.</p></div>
      </section>
      <Suspense fallback={<div className="container-shell grid grid-cols-2 gap-5 py-16 md:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse bg-[#e8eef1]" />)}</div>}><ExploreCatalog /></Suspense>
    </>
  );
}
