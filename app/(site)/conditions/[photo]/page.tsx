import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GroundViewPage } from "@/components/ground-view-page";
import { findGroundView, groundStation, groundViewId, groundViews } from "@/lib/ground-views";

// Every photograph is known at build time; anything else is a 404, not a render.
export const dynamicParams = false;

export function generateStaticParams() {
  return groundViews.map((view) => ({ photo: groundViewId(view) }));
}

export async function generateMetadata({ params }: { params: Promise<{ photo: string }> }): Promise<Metadata> {
  const view = findGroundView((await params).photo);
  if (!view) return {};
  return {
    title: `${view.clouds[0]} over ${groundStation.name}`,
    description: `${view.clouds.join(" and ")} photographed from the ground at ${groundStation.name}, ${groundStation.place}.`,
  };
}

export default async function GroundPhotoPage({ params }: { params: Promise<{ photo: string }> }) {
  const view = findGroundView((await params).photo);
  if (!view) notFound();
  return <GroundViewPage view={view} />;
}
