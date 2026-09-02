import generated from "@/data/catalog.generated.json";
import { oktaLabel, oktasFromFraction, type Okta, type Season, type TimeOfDay } from "./vocab";

export { artifactTypes, oktaValues, oktaLabel, oktasFromFraction, seasons, timesOfDay } from "./vocab";
export type { ArtifactType, Okta, Season, TimeOfDay } from "./vocab";

export type Artifact = {
  type: "source" | "mask";
  url: string;
  objectKey: string;
  bytes: number;
  checksum: string;
  mediaType: string;
};

export type ImageRecord = {
  id: string;
  collection: string;
  release: string;
  /** Capture sequence the frame belongs to, e.g. "vid7". */
  videoId: string;
  /** Position of the frame within its sequence. */
  frameIndex: number;
  /**
   * Measured cloud cover as a share of the camera's circular field of view, and
   * the same measurement in oktas (eighths of sky), the synoptic convention.
   * Both are absent on frames that have not been segmented: cloud cover comes
   * from the mask, so with no mask there is no measurement to report.
   */
  cloudFraction?: number;
  cloudCoverOktas?: Okta;
  /**
   * Scale at which the mask was delivered relative to its source frame. 1 for
   * every correctly registered sequence; >1 where the mask was rendered larger
   * than the frame it segments, in which case the viewer must scale it back to
   * line the two up.
   */
  maskScale: number;
  width: number;
  height: number;
  /** Primary image for listings: the source frame when delivered, else the mask. */
  image: string;
  sourceUrl?: string;
  maskUrl?: string;
  hasSource: boolean;
  hasMask: boolean;
  alt: string;
  tags: string[];
  artifacts: Artifact[];
  /** Stable ordering key: real timestamp when known, sequence position otherwise. */
  sortKey: string;
  // Present only when the capture team has supplied provenance for the sequence.
  capturedAt?: string;
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  season?: Season;
  timeOfDay?: TimeOfDay;
  instrument?: string;
};

export type Release = {
  version: string;
  images: number;
  size: string;
  current: boolean;
  publishedAt?: string;
};

export type Collection = {
  slug: string;
  title: string;
  shortTitle: string;
  kicker: string;
  description: string;
  coverage: string;
  videoIds: string[];
  images: number;
  artifacts: number;
  withSource: number;
  /** Records carrying a mask, and therefore a measured cloud cover. */
  segmented: number;
  image: string;
  imageAlt: string;
  releases: Release[];
  // Editorial metadata, present only once supplied in data/provenance.json.
  locationName?: string;
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  instrument?: string;
  license?: string;
  citation?: string;
  doi?: string;
};

type GeneratedImage = (typeof generated)["images"][number];
type GeneratedCollection = (typeof generated)["collections"][number];

const bytesToSize = (bytes: number) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const pad = (value: number, width: number) => String(value).padStart(width, "0");

function toRecord(image: GeneratedImage): ImageRecord {
  const artifacts: Artifact[] = image.artifacts.map((artifact) => ({
    type: artifact.type as "source" | "mask",
    url: artifact.publicUrl,
    objectKey: artifact.objectKey,
    bytes: artifact.bytes,
    checksum: artifact.checksum,
    mediaType: artifact.mediaType,
  }));
  const sourceUrl = artifacts.find((artifact) => artifact.type === "source")?.url;
  const maskUrl = artifacts.find((artifact) => artifact.type === "mask")?.url;
  const measured = image as Partial<{ cloudFraction: number }>;
  const oktas =
    measured.cloudFraction === undefined ? undefined : (oktasFromFraction(measured.cloudFraction) as Okta);
  const sequenceKey = `${pad(Number(image.videoId.slice(3)), 3)}-${pad(image.frameIndex, 7)}`;
  const optional = image as Partial<{
    capturedAt: string;
    location: string;
    coordinates: { latitude: number; longitude: number };
    season: Season;
    timeOfDay: TimeOfDay;
    instrument: string;
  }>;

  return {
    id: image.id,
    collection: image.collection,
    release: image.release,
    videoId: image.videoId,
    frameIndex: image.frameIndex,
    ...(measured.cloudFraction === undefined
      ? {}
      : { cloudFraction: measured.cloudFraction, cloudCoverOktas: oktas }),
    maskScale: image.maskScale,
    width: image.width,
    height: image.height,
    image: (sourceUrl ?? maskUrl)!,
    sourceUrl,
    maskUrl,
    hasSource: Boolean(sourceUrl),
    hasMask: Boolean(maskUrl),
    alt: sourceUrl
      ? `All-sky camera frame ${image.frameIndex} of sequence ${image.videoId}${
          oktas === undefined ? ", not yet segmented" : `, measured at ${oktaLabel(oktas)} cloud cover`
        }.`
      : `Binary cloud segmentation mask for frame ${image.frameIndex} of sequence ${image.videoId}, measured at ${oktaLabel(oktas!)} cloud cover.`,
    tags: [
      image.videoId,
      ...(oktas === undefined ? ["unsegmented"] : [oktaLabel(oktas)]),
      sourceUrl && maskUrl ? "source + mask" : maskUrl ? "mask only" : "source only",
    ],
    artifacts,
    sortKey: optional.capturedAt ?? sequenceKey,
    ...(optional.capturedAt ? { capturedAt: optional.capturedAt } : {}),
    ...(optional.location ? { location: optional.location } : {}),
    ...(optional.coordinates ? { coordinates: optional.coordinates } : {}),
    ...(optional.season ? { season: optional.season } : {}),
    ...(optional.timeOfDay ? { timeOfDay: optional.timeOfDay } : {}),
    ...(optional.instrument ? { instrument: optional.instrument } : {}),
  };
}

export const images: ImageRecord[] = (generated.images as GeneratedImage[]).map(toRecord);

const imagesByCollection = new Map<string, ImageRecord[]>();
for (const image of images) {
  const list = imagesByCollection.get(image.collection) ?? [];
  list.push(image);
  imagesByCollection.set(image.collection, list);
}

function toCollection(collection: GeneratedCollection): Collection {
  const members = imagesByCollection.get(collection.slug) ?? [];
  // Prefer a fully paired frame for the cover so the sequence is shown at its best.
  const cover =
    members.find((image) => image.hasSource && image.hasMask) ??
    members.find((image) => image.hasSource) ??
    members[0];
  const sourceOnly = collection.images - collection.segmented;
  const maskOnly = collection.images - collection.withSource;
  const frames = members.map((image) => image.frameIndex);
  const editorial = collection as Partial<{
    locationName: string;
    coordinates: { latitude: number; longitude: number };
    instrument: string;
    license: string;
    citation: string;
    doi: string;
  }>;
  const sequenceLabel = collection.videoIds.join(", ");

  return {
    slug: collection.slug,
    title: editorial.locationName ?? `Capture sequence ${sequenceLabel}`,
    shortTitle: editorial.locationName ?? sequenceLabel,
    kicker: `ALL-SKY CLOUD SEGMENTATION · ${sequenceLabel.toUpperCase()}`,
    description: [
      `${collection.images.toLocaleString()} all-sky frames from capture sequence ${sequenceLabel}. `,
      `${collection.segmented.toLocaleString()} carry a binary cloud mask and a measured cloud cover`,
      maskOnly > 0 ? `, ${maskOnly.toLocaleString()} of them without the source frame` : "",
      ".",
      sourceOnly > 0
        ? ` A further ${sourceOnly.toLocaleString()} frames are sampled evenly from the rest of the sequence and have not been segmented yet.`
        : "",
    ].join(""),
    coverage: frames.length
      ? `Frames ${Math.min(...frames).toLocaleString()}–${Math.max(...frames).toLocaleString()} · ${collection.segmented.toLocaleString()} of ${collection.images.toLocaleString()} segmented`
      : "No frames",
    videoIds: collection.videoIds,
    images: collection.images,
    artifacts: collection.artifacts,
    withSource: collection.withSource,
    segmented: collection.segmented,
    image: cover?.image ?? "",
    imageAlt: cover?.alt ?? "",
    releases: [
      { version: generated.release, images: collection.images, size: bytesToSize(collection.bytes), current: true },
    ],
    ...(editorial.locationName
      ? {
          locationName: editorial.locationName,
          location: editorial.coordinates
            ? `${editorial.locationName} · ${editorial.coordinates.latitude}, ${editorial.coordinates.longitude}`
            : editorial.locationName,
        }
      : {}),
    ...(editorial.coordinates ? { coordinates: editorial.coordinates } : {}),
    ...(editorial.instrument ? { instrument: editorial.instrument } : {}),
    ...(editorial.license ? { license: editorial.license } : {}),
    ...(editorial.citation ? { citation: editorial.citation } : {}),
    ...(editorial.doi ? { doi: editorial.doi } : {}),
  };
}

export const collections: Collection[] = (generated.collections as GeneratedCollection[]).map(toCollection);

/** Capture sequences present in the catalogue, ordered numerically. */
export const videoIds = [...new Set(images.map((image) => image.videoId))].sort(
  (a, b) => Number(a.slice(3)) - Number(b.slice(3)),
);

/** Sites, once provenance supplies them. Empty until then — never guessed. */
export const locations = [
  ...new Set(images.map((image) => image.location).filter((value): value is string => Boolean(value))),
].sort();

export const archiveImageTotal = images.length;
/** Records carrying a mask, and so a measured cloud cover. */
export const segmentedImageTotal = images.filter((image) => image.hasMask).length;
export const archiveCounts = generated.counts;
export const maskRegistration = generated.maskRegistration;
export const generatedAt = generated.generatedAt;

export const collectionBySlug = (slug: string) => collections.find((collection) => collection.slug === slug);
export const imageById = (id: string) => images.find((image) => image.id === id);
export const collectionTitle = (slug: string) => collectionBySlug(slug)?.shortTitle ?? slug;
export const imagesInCollection = (slug: string) => imagesByCollection.get(slug) ?? [];

export const formatDate = (value: string, withTime = false) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" } : {}),
  }).format(new Date(value));

/** How a record is labelled in listings when there is no capture timestamp yet. */
export const frameLabel = (image: ImageRecord) => `${image.videoId} · frame ${image.frameIndex.toLocaleString()}`;

export const recordTimestamp = (image: ImageRecord) =>
  image.capturedAt ? formatDate(image.capturedAt, true) : frameLabel(image);
