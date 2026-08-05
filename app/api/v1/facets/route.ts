import { envelope } from "@/lib/api";
import { artifactTypes, collections, images, locations, seasons, skyClasses, timesOfDay } from "@/lib/catalog";

function count(values: readonly string[], field: "skyClass" | "season" | "timeOfDay" | "location") {
  return values.map((value) => ({ value, count: images.filter((image) => image[field] === value).length }));
}

export async function GET(request: Request) {
  return envelope({
    collections: collections.map((item) => ({ value: item.slug, label: item.shortTitle, count: images.filter((image) => image.collection === item.slug).length })),
    skyClasses: count(skyClasses, "skyClass"), seasons: count(seasons, "season"), timesOfDay: count(timesOfDay, "timeOfDay"), locations: count(locations, "location"),
    artifacts: artifactTypes.map((value) => ({ value, count: images.filter((image) => image.artifacts.some((artifact) => artifact.type === value)).length })),
  }, request);
}
