import { z } from "zod";
import { seasons, timesOfDay } from "./vocab";

const checksum = z.string().regex(/^[a-f0-9]{64}$/i, "Expected a SHA-256 checksum");
const artifactSchema = z.object({
  type: z.string().min(1).max(50),
  mediaType: z.string().min(3),
  objectKey: z.string().min(1),
  publicUrl: z.string().min(1),
  checksum,
  bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const imageSchema = z.object({
  id: z.string().regex(/^WAS-[A-Z0-9-]+$/),
  // Sequence identity is always known: it is encoded in the source filenames.
  videoId: z.string().regex(/^vid\d+$/),
  frameIndex: z.number().int().min(0),
  // Measured from the mask against the camera's valid circular field of view.
  // Absent on frames that have not been segmented yet: there is nothing to measure.
  cloudFraction: z.number().min(0).max(1).optional(),
  cloudCoverOktas: z.number().int().min(0).max(8).optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  // Everything below depends on per-sequence provenance the capture team supplies.
  // Absent rather than invented when that provenance is not available.
  capturedAt: z.string().datetime().optional(),
  location: z.string().min(1).optional(),
  coordinates: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional(),
  season: z.enum(seasons).optional(),
  timeOfDay: z.enum(timesOfDay).optional(),
  instrument: z.string().min(1).optional(),
  provenance: z.record(z.string(), z.unknown()),
  custom: z.record(z.string(), z.unknown()).optional(),
  artifacts: z.array(artifactSchema).min(1),
});

export const manifestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  collection: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    license: z.string().min(1).optional(),
    citation: z.string().min(1).optional(),
    doi: z.string().min(1).optional(),
  }),
  release: z.object({ version: z.string().regex(/^\d+\.\d+(?:\.\d+)?$/), publishedAt: z.string().datetime().optional(), bundleUrl: z.string().min(1).optional(), bundleChecksum: checksum.optional() }),
  images: z.array(imageSchema).min(1),
});

export type ReleaseManifest = z.infer<typeof manifestSchema>;

export function validateManifest(input: unknown): ReleaseManifest {
  const manifest = manifestSchema.parse(input);
  const imageIds = new Set<string>();
  for (const image of manifest.images) {
    if (imageIds.has(image.id)) throw new Error(`Duplicate image identifier: ${image.id}`);
    imageIds.add(image.id);
    const types = new Set<string>();
    for (const artifact of image.artifacts) {
      if (types.has(artifact.type)) throw new Error(`Duplicate artifact type ${artifact.type} for ${image.id}`);
      types.add(artifact.type);
      if (artifact.width && artifact.height && artifact.type !== "thumbnail" && (artifact.width !== image.width || artifact.height !== image.height)) {
        throw new Error(`Artifact dimensions do not match source record ${image.id}`);
      }
    }
    // Both delivered sets are partial, so a record may hold the source frame, the
    // mask, or both -- but never neither.
    if (!types.has("mask") && !types.has("source")) {
      throw new Error(`Record ${image.id} has neither a source frame nor a mask`);
    }
    // A measurement only means anything alongside the mask it was taken from.
    if (image.cloudFraction !== undefined && !types.has("mask")) {
      throw new Error(`Record ${image.id} reports cloud cover without a mask`);
    }
    if ((image.cloudFraction === undefined) !== (image.cloudCoverOktas === undefined)) {
      throw new Error(`Record ${image.id} must carry cloud fraction and oktas together`);
    }
  }
  return manifest;
}

export function assertReleaseWritable(status: "DRAFT" | "PUBLISHED" | "RETIRED") {
  if (status !== "DRAFT") throw new Error("Published releases are immutable; create a new release for corrections.");
}

export function normalizeSearchText(image: ReleaseManifest["images"][number]) {
  return [image.id, image.videoId, image.location, image.season, image.timeOfDay, image.instrument]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}
