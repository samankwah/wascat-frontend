import type { Metadata } from "next";
import { GroundViewPage } from "@/components/ground-view-page";
import { groundStation, orderedGroundViews } from "@/lib/ground-views";

export const metadata: Metadata = {
  title: "Current sky conditions",
  description: `Ground photographs of the sky at ${groundStation.name}, with the clouds in each.`,
};

/** The newest ground photograph; every photograph also has its own page under /conditions/[photo]. */
export default function ConditionsPage() {
  const [newest] = orderedGroundViews();
  return <GroundViewPage view={newest} />;
}
