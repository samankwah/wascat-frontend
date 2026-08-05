import { z } from "zod";
import { seasons, skyClasses, timesOfDay } from "./catalog";

const checksum = z.string().regex(/^[a-f0-9]{64}$/i, "Expected a SHA-256 checksum");
const artifactSchema = z.object({
  type: z.string().min(1).max(50),
  mediaType: z.string().min(3),
  objectKey: z.string().min(1),
  publicUrl: z.string().url(),
  checksum,
  bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const imageSchema = z.object({
  id: z.string().regex(/^WAS-[A-Z0-9-]+$/),
  capturedAt: z.string().datetime(),
  location: z.string().min(1),
  coordinates: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional(),
  skyClass: z.enum(skyClasses),
  season: z.enum(seasons),
  timeOfDay: z.enum(timesOfDay),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  instrument: z.string().min(1),
  provenance: z.record(z.string(), z.unknown()),
  custom: z.record(z.string(), z.unknown()).optional(),
  artifacts: z.array(artifactSchema).min(1),
});

export const manifestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  collection: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    license: z.string().min(1),
    citation: z.string().min(1),
    doi: z.string().min(1).optional(),
  }),
  release: z.object({ version: z.string().regex(/^\d+\.\d+(?:\.\d+)?$/), publishedAt: z.string().datetime().optional(), bundleUrl: z.string().url(), bundleChecksum: checksum }),
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
    if (!types.has("source")) throw new Error(`Missing source artifact for ${image.id}`);
  }
  return manifest;
}

export function assertReleaseWritable(status: "DRAFT" | "PUBLISHED" | "RETIRED") {
  if (status !== "DRAFT") throw new Error("Published releases are immutable; create a new release for corrections.");
}

export function normalizeSearchText(image: ReleaseManifest["images"][number]) {
  return [image.id, image.location, image.skyClass, image.season, image.timeOfDay, image.instrument]
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}
