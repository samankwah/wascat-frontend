// Controlled vocabularies with no dependency on generated catalog data, so that
// the ingest script can import the manifest contract without pulling in the
// catalog JSON it is responsible for producing.

export const artifactTypes = ["source", "mask"] as const;

// Derivable from a real capture timestamp once per-sequence provenance lands.
export const seasons = ["Harmattan", "Dry season", "Wet season", "Transition"] as const;
export const timesOfDay = ["Morning", "Midday", "Afternoon", "Evening"] as const;

export type ArtifactType = (typeof artifactTypes)[number];
export type Season = (typeof seasons)[number];
export type TimeOfDay = (typeof timesOfDay)[number];

/**
 * Cloud cover in oktas (eighths of the sky) — the standard synoptic sky-cover
 * measure. Computed from the segmentation mask, so every value is measured
 * rather than assigned.
 */
export const oktaValues = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export type Okta = (typeof oktaValues)[number];

export const oktaLabel = (okta: number) =>
  okta === 0 ? "0/8 · Clear" : okta === 8 ? "8/8 · Overcast" : `${okta}/8`;

export const oktasFromFraction = (fraction: number) =>
  Math.min(8, Math.max(0, Math.round(fraction * 8)));
