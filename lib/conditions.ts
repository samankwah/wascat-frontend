/**
 * The sky at the ground station: its photographs, newest first, and the
 * newest all-sky frame the archive holds for the same station.
 *
 * Both halves come from one place so the home page and /conditions never
 * disagree about what "current" means. The frame is matched by station name
 * rather than taken from the archive as a whole, so the cloud readings shown
 * beside a Kumasi photograph are Kumasi's.
 */
import { getCollectionImages, getCollections } from "./api-client";
import { groundStation, orderedGroundViews, type GroundView } from "./ground-views";
import type { CollectionSummary, ImageRecord } from "./types";
import { oktaLabel, visibilityLabel, visibilityTerm } from "./vocab";

export type StationConditions = {
  /** Every ground photograph, newest first. */
  views: GroundView[];
  /** The newest of them. */
  view?: GroundView;
  frame?: ImageRecord;
  collection?: CollectionSummary;
};

export async function getStationConditions(): Promise<StationConditions> {
  const views = orderedGroundViews();
  const collections = await getCollections();
  const collection = collections.find((entry) => entry.locationName === groundStation.archiveStation);
  const [frame] = collection ? await getCollectionImages(collection.slug, { sort: "newest", limit: 1 }) : [];
  return { views, view: views[0], frame, collection };
}

export type Reading = {
  label: string;
  /** Short enough for the home page card. */
  value: string;
  /** The full reading, for /conditions. */
  detail: string;
};

/**
 * What the station has actually reported, in a fixed order. A reading the
 * archive lacks is left out rather than shown as "Not recorded", so a missing
 * report never reads as a clear day; `missing` names them for a page that
 * wants to say so once.
 */
export function stationReadings({ views, view, frame }: StationConditions): {
  readings: Reading[];
  missing: string[];
} {
  // The photograph's own report first, then the frame's: both are the station's.
  const visibility = view?.visibilityM ?? frame?.visibilityM ?? undefined;
  // The genera the photographs show, most often seen first. The all-sky
  // frame's own classification is a different instrument's reading, so the
  // page shows it beside that frame rather than here.
  const seen = new Map<string, number>();
  for (const { clouds } of views) for (const cloud of clouds) seen.set(cloud, (seen.get(cloud) ?? 0) + 1);
  const genera = [...seen].sort((a, b) => b[1] - a[1]);
  const measured = frame?.cloudCoverOktas ?? undefined;
  const observed = frame?.observedCloudCoverOktas ?? undefined;

  const all: [string, Reading | undefined][] = [
    [
      "cloud types",
      genera.length > 0
        ? {
            label: genera.length === 1 ? "Cloud type" : "Cloud types",
            value: genera.map(([name]) => name).join(", "),
            detail: genera.map(([name, count]) => `${name} (${count})`).join(", "),
          }
        : undefined,
    ],
    [
      "visibility",
      visibility != null
        ? { label: "Visibility", value: visibilityLabel(visibility), detail: `${visibilityLabel(visibility)} · ${visibilityTerm(visibility)}` }
        : undefined,
    ],
    [
      "measured cloud cover",
      measured != null
        ? {
            label: "Cloud cover",
            value: oktaLabel(measured),
            detail: `${oktaLabel(measured)}${frame?.cloudFraction != null ? ` · ${(frame.cloudFraction * 100).toFixed(1)}% of the sky` : ""}`,
          }
        : undefined,
    ],
    ["observed cloud cover", observed != null ? { label: "Observed cover", value: oktaLabel(observed), detail: oktaLabel(observed) } : undefined],
  ];

  return {
    readings: all.flatMap(([, reading]) => (reading ? [reading] : [])),
    missing: all.flatMap(([name, reading]) => (reading ? [] : [name])),
  };
}
