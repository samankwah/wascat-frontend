export const artifactTypes = ["source", "thumbnail", "mask", "overlay"] as const;
export const skyClasses = [
  "Clear",
  "Cirrus",
  "Altocumulus",
  "Altostratus",
  "Stratus",
  "Stratocumulus",
  "Cumulus",
  "Cumulonimbus",
  "Mixed",
] as const;
export const seasons = ["Harmattan", "Dry season", "Wet season", "Transition"] as const;
export const timesOfDay = ["Morning", "Midday", "Afternoon", "Evening"] as const;

export type ArtifactType = (typeof artifactTypes)[number];
export type SkyClass = (typeof skyClasses)[number];
export type Season = (typeof seasons)[number];
export type TimeOfDay = (typeof timesOfDay)[number];

export type Artifact = {
  type: ArtifactType;
  url: string;
  bytes: number;
  checksum: string;
};

export type ImageRecord = {
  id: string;
  collection: string;
  release: string;
  capturedAt: string;
  location: string;
  skyClass: SkyClass;
  season: Season;
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  instrument: string;
  image: string;
  alt: string;
  tags: string[];
  artifacts: Artifact[];
};

export type Release = {
  version: string;
  publishedAt: string;
  images: number;
  size: string;
  current: boolean;
  checksum: string;
};

export type Collection = {
  slug: string;
  title: string;
  shortTitle: string;
  kicker: string;
  description: string;
  locationName: string;
  location: string;
  coverage: string;
  instrument: string;
  image: string;
  imageAlt: string;
  images: number;
  artifacts: number;
  license: string;
  citation: string;
  doi?: string;
  releases: Release[];
};

const sha = "e31f942c8a124172b73f50c682ba9481bf34eb3a62869a337170b335b63f4812";

export const collections: Collection[] = [
  {
    slug: "kumasi-convective-skies",
    title: "Kumasi Convective Skies",
    shortTitle: "Kumasi Convective Skies",
    kicker: "HUMID-FOREST CONVECTION · GHANA",
    description: "An expert-labelled demonstration collection of humid-forest convection, layered cloud, and urban sky conditions represented around Kumasi.",
    locationName: "Kumasi, Ghana",
    location: "Kumasi, Ghana · 6.6885° N, 1.6244° W",
    coverage: "January 2023 — June 2026 · demonstration",
    instrument: "Demonstration fixed-view RGB camera profile · 2,048 × 1,536 px",
    image: "/images/kumasi-hero.png",
    imageAlt: "Bright cumulus clouds above the green urban skyline of Kumasi, Ghana.",
    images: 10842,
    artifacts: 32526,
    license: "Creative Commons Attribution 4.0 International",
    citation: "WASCAT Demonstration Archive (2026). Kumasi Convective Skies, release 1.0. Expert-labelled demonstration records; not an operational dataset.",
    releases: [
      { version: "1.0", publishedAt: "2026-07-15", images: 10842, size: "21.7 GB (est.)", current: true, checksum: sha },
    ],
  },
  {
    slug: "gulf-of-guinea-coastal-clouds",
    title: "Gulf of Guinea Coastal Clouds",
    shortTitle: "Gulf of Guinea Coastal Clouds",
    kicker: "COASTAL LOW CLOUD · NIGERIA",
    description: "An expert-labelled demonstration collection of coastal low cloud, marine haze, and aerosol-influenced skies represented around Lagos.",
    locationName: "Lagos, Nigeria",
    location: "Lagos, Nigeria · 6.5244° N, 3.3792° E",
    coverage: "March 2023 — June 2026 · demonstration",
    instrument: "Demonstration coastal RGB camera profile · 1,536 × 1,152 px",
    image: "/images/lagos-coastal-clouds.png",
    imageAlt: "Low coastal cloud and humid marine haze above the Lagos shoreline in Nigeria.",
    images: 7426,
    artifacts: 22278,
    license: "Creative Commons Attribution 4.0 International",
    citation: "WASCAT Demonstration Archive (2026). Gulf of Guinea Coastal Clouds, release 1.0. Expert-labelled demonstration records; not an operational dataset.",
    releases: [
      { version: "1.0", publishedAt: "2026-07-15", images: 7426, size: "14.9 GB (est.)", current: true, checksum: sha },
    ],
  },
  {
    slug: "sahel-sky-observatory",
    title: "Sahel Sky Observatory",
    shortTitle: "Sahel Sky Observatory",
    kicker: "DUST & SEASONAL CONVECTION · BURKINA FASO",
    description: "An expert-labelled demonstration collection of Sahelian dust, high cloud, and seasonal convection represented around Ouagadougou.",
    locationName: "Ouagadougou, Burkina Faso",
    location: "Ouagadougou, Burkina Faso · 12.3714° N, 1.5197° W",
    coverage: "December 2023 — June 2026 · demonstration",
    instrument: "Demonstration dryland RGB camera profile · 1,536 × 1,152 px",
    image: "/images/ouagadougou-sahel-sky.png",
    imageAlt: "High cirrus, distant convection, and dust-filtered light over a dry Sahel landscape near Ouagadougou, Burkina Faso.",
    images: 4701,
    artifacts: 14103,
    license: "Creative Commons Attribution 4.0 International",
    citation: "WASCAT Demonstration Archive (2026). Sahel Sky Observatory, release 1.0. Expert-labelled demonstration records; not an operational dataset.",
    releases: [
      { version: "1.0", publishedAt: "2026-07-15", images: 4701, size: "9.4 GB (est.)", current: true, checksum: sha },
    ],
  },
];

export const locations = collections.map((collection) => collection.locationName);
export const archiveImageTotal = collections.reduce((total, collection) => total + collection.images, 0);

type ImageSeed = readonly [
  id: string,
  collection: string,
  release: string,
  capturedAt: string,
  location: string,
  skyClass: SkyClass,
  season: Season,
  timeOfDay: TimeOfDay,
  image: string,
  tags: readonly string[],
];

const seeds: readonly ImageSeed[] = [
  ["WAS-KMS-20250523-154200", "kumasi-convective-skies", "1.0", "2025-05-23T15:42:00Z", "Kumasi, Ghana", "Cumulonimbus", "Wet season", "Afternoon", "/images/kumasi-hero.png", ["deep convection", "urban horizon"]],
  ["WAS-KMS-20240718-121530", "kumasi-convective-skies", "1.0", "2024-07-18T12:15:30Z", "Kumasi, Ghana", "Cumulus", "Wet season", "Midday", "/images/kumasi-hero.png", ["humid forest", "towering"]],
  ["WAS-KMS-20250311-092600", "kumasi-convective-skies", "1.0", "2025-03-11T09:26:00Z", "Kumasi, Ghana", "Altocumulus", "Transition", "Morning", "/images/kumasi-hero.png", ["broken field", "moisture return"]],
  ["WAS-KMS-20241009-173800", "kumasi-convective-skies", "1.0", "2024-10-09T17:38:00Z", "Kumasi, Ghana", "Mixed", "Transition", "Evening", "/images/kumasi-hero.png", ["layered", "urban sky"]],
  ["WAS-KMS-20250127-100400", "kumasi-convective-skies", "1.0", "2025-01-27T10:04:00Z", "Kumasi, Ghana", "Clear", "Dry season", "Morning", "/images/kumasi-hero.png", ["low cloud fraction", "dry air"]],
  ["WAS-KMS-20230615-081900", "kumasi-convective-skies", "1.0", "2023-06-15T08:19:00Z", "Kumasi, Ghana", "Altostratus", "Wet season", "Morning", "/images/kumasi-hero.png", ["layered deck", "diffuse light"]],
  ["WAS-LOS-20250602-071200", "gulf-of-guinea-coastal-clouds", "1.0", "2025-06-02T07:12:00Z", "Lagos, Nigeria", "Stratus", "Wet season", "Morning", "/images/lagos-coastal-clouds.png", ["coastal low cloud", "humid haze"]],
  ["WAS-LOS-20240819-104500", "gulf-of-guinea-coastal-clouds", "1.0", "2024-08-19T10:45:00Z", "Lagos, Nigeria", "Stratocumulus", "Wet season", "Morning", "/images/lagos-coastal-clouds.png", ["marine deck", "broken low cloud"]],
  ["WAS-LOS-20250417-160800", "gulf-of-guinea-coastal-clouds", "1.0", "2025-04-17T16:08:00Z", "Lagos, Nigeria", "Mixed", "Transition", "Afternoon", "/images/lagos-coastal-clouds.png", ["aerosol veil", "coastal transition"]],
  ["WAS-LOS-20250114-134100", "gulf-of-guinea-coastal-clouds", "1.0", "2025-01-14T13:41:00Z", "Lagos, Nigeria", "Altostratus", "Harmattan", "Midday", "/images/lagos-coastal-clouds.png", ["dry haze", "diffuse sun"]],
  ["WAS-LOS-20241206-152900", "gulf-of-guinea-coastal-clouds", "1.0", "2024-12-06T15:29:00Z", "Lagos, Nigeria", "Clear", "Dry season", "Afternoon", "/images/lagos-coastal-clouds.png", ["marine haze", "low cloud fraction"]],
  ["WAS-LOS-20230922-120600", "gulf-of-guinea-coastal-clouds", "1.0", "2023-09-22T12:06:00Z", "Lagos, Nigeria", "Cumulus", "Wet season", "Midday", "/images/lagos-coastal-clouds.png", ["coastal convection", "humid boundary layer"]],
  ["WAS-OUA-20250108-093300", "sahel-sky-observatory", "1.0", "2025-01-08T09:33:00Z", "Ouagadougou, Burkina Faso", "Clear", "Harmattan", "Morning", "/images/ouagadougou-sahel-sky.png", ["mineral dust", "reduced visibility"]],
  ["WAS-OUA-20250226-164800", "sahel-sky-observatory", "1.0", "2025-02-26T16:48:00Z", "Ouagadougou, Burkina Faso", "Cirrus", "Dry season", "Afternoon", "/images/ouagadougou-sahel-sky.png", ["high cloud", "dust-filtered light"]],
  ["WAS-OUA-20240421-102700", "sahel-sky-observatory", "1.0", "2024-04-21T10:27:00Z", "Ouagadougou, Burkina Faso", "Altocumulus", "Transition", "Morning", "/images/ouagadougou-sahel-sky.png", ["moisture return", "mid-level cloud"]],
  ["WAS-OUA-20240730-181500", "sahel-sky-observatory", "1.0", "2024-07-30T18:15:00Z", "Ouagadougou, Burkina Faso", "Cumulonimbus", "Wet season", "Evening", "/images/ouagadougou-sahel-sky.png", ["seasonal convection", "distant tower"]],
  ["WAS-OUA-20250512-144400", "sahel-sky-observatory", "1.0", "2025-05-12T14:44:00Z", "Ouagadougou, Burkina Faso", "Mixed", "Transition", "Afternoon", "/images/ouagadougou-sahel-sky.png", ["dust", "developing convection"]],
  ["WAS-OUA-20231218-113800", "sahel-sky-observatory", "1.0", "2023-12-18T11:38:00Z", "Ouagadougou, Burkina Faso", "Altostratus", "Harmattan", "Morning", "/images/ouagadougou-sahel-sky.png", ["dust layer", "high overcast"]],
];

export const images: ImageRecord[] = seeds.map((seed, index) => {
  const collection = collections.find((item) => item.slug === seed[1]);
  return {
    id: seed[0],
    collection: seed[1],
    release: seed[2],
    capturedAt: seed[3],
    location: seed[4],
    skyClass: seed[5],
    season: seed[6],
    timeOfDay: seed[7],
    width: index < 6 ? 2048 : 1536,
    height: index < 6 ? 1536 : 1152,
    instrument: collection?.instrument.split(" · ")[0] ?? "Demonstration camera profile",
    image: seed[8],
    alt: `${seed[5]} sky observation representing expert-labelled demonstration data for ${seed[4]} on ${new Date(seed[3]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`,
    tags: [...seed[9]],
    artifacts: artifactTypes.map((type, artifactIndex) => ({
      type,
      url: seed[8],
      bytes: 1895517 - artifactIndex * 245300,
      checksum: sha,
    })),
  };
});

export const collectionBySlug = (slug: string) => collections.find((collection) => collection.slug === slug);
export const imageById = (id: string) => images.find((image) => image.id === id);
export const collectionTitle = (slug: string) => collectionBySlug(slug)?.shortTitle ?? slug;

export const formatDate = (value: string, withTime = false) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" } : {}),
  }).format(new Date(value));
