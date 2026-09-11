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

/**
 * The synoptic sky-cover terms, in eighths. An okta count is reported as an
 * amount, not just a fraction: 3/8 is "Scattered" to a meteorologist and a bare
 * ratio to everyone else. Only the two ends were named before, so the middle of
 * the scale read as arithmetic.
 *
 * The bands are the standard ones and their boundaries are not adjustable:
 * they are what the terms mean, not a presentation choice. Kept in step with
 * `_OKTA_TERMS` in the backend's core/jsformat.py, which serves these same
 * strings over the API.
 */
const oktaTerms: Record<number, string> = {
  0: "Clear",
  1: "Few",
  2: "Few",
  3: "Scattered",
  4: "Scattered",
  5: "Broken",
  6: "Broken",
  7: "Broken",
  8: "Overcast",
};

export const oktaLabel = (okta: number) =>
  oktaTerms[okta] ? `${okta}/8 · ${oktaTerms[okta]}` : `${okta}/8`;

/** Just the synoptic term (e.g. "Broken"), for a display that already shows the fraction itself. */
export const oktaTerm = (okta: number) => oktaTerms[okta] ?? "";

export const oktasFromFraction = (fraction: number) =>
  Math.min(8, Math.max(0, Math.round(fraction * 8)));
