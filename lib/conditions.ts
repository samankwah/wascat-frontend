/**
 * The sky at the ground station: its newest photograph, and the newest
 * all-sky frame the archive holds for the same station.
 *
 * Both halves come from one place so the home page and /conditions never
 * disagree about what "current" means. The frame is matched by station name
 * rather than taken from the archive as a whole, so the cloud readings shown
 * beside a Kumasi photograph are Kumasi's.
 */
import { getCollectionImages, getCollections } from "./api-client";
import { groundStation, orderedGroundViews, type GroundView } from "./ground-views";
import type { CollectionSummary, ImageRecord } from "./types";

export type StationConditions = {
  view?: GroundView;
  frame?: ImageRecord;
  collection?: CollectionSummary;
};

export async function getStationConditions(): Promise<StationConditions> {
  const [view] = orderedGroundViews();
  const collections = await getCollections();
  const collection = collections.find((entry) => entry.locationName === groundStation.archiveStation);
  const [frame] = collection ? await getCollectionImages(collection.slug, { sort: "newest", limit: 1 }) : [];
  return { view, frame, collection };
}
