import { envelope } from "@/lib/api";
import { artifactTypes, collections, images, locations, oktaLabel, oktaValues, seasons, timesOfDay, videoIds } from "@/lib/catalog";

/** Counts for a controlled vocabulary against an optional record field. */
function count<K extends "season" | "timeOfDay" | "location">(values: readonly string[], field: K) {
  return values.map((value) => ({ value, count: images.filter((image) => image[field] === value).length }));
}

export async function GET(request: Request) {
  return envelope({
    collections: collections.map((item) => ({
      value: item.slug,
      label: item.shortTitle,
      count: images.filter((image) => image.collection === item.slug).length,
    })),
    sequences: videoIds.map((videoId) => ({
      value: videoId,
      count: images.filter((image) => image.videoId === videoId).length,
    })),
    // Measured from each mask, so these counts describe the imagery itself.
    // They cover the segmented records only -- an unsegmented frame has no
    // cloud cover to bucket, and counting it as 0 oktas would invent a clear sky.
    cloudCoverOktas: oktaValues.map((okta) => ({
      value: okta,
      label: oktaLabel(okta),
      count: images.filter((image) => image.cloudCoverOktas === okta).length,
    })),
    segmentation: [
      { value: "segmented", label: "Has a cloud mask", count: images.filter((image) => image.hasMask).length },
      { value: "unsegmented", label: "Not yet segmented", count: images.filter((image) => !image.hasMask).length },
    ],
    artifacts: artifactTypes.map((value) => ({
      value,
      count: images.filter((image) => image.artifacts.some((artifact) => artifact.type === value)).length,
    })),
    // Empty until the capture team supplies per-sequence provenance.
    seasons: count(seasons, "season"),
    timesOfDay: count(timesOfDay, "timeOfDay"),
    locations: count(locations, "location"),
  }, request);
}
