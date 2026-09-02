import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { archiveCounts, archiveImageTotal, collections, images, maskRegistration, segmentedImageTotal, videoIds } from "../lib/catalog";
import { oktasFromFraction } from "../lib/vocab";

const legacyTerms = /reyk|iceland|north atlantic|polar|akureyri|faxaf|WAS-(RKV|NAS|PCR)|winter|spring|summer|autumn/i;

describe("all-sky cloud segmentation catalog", () => {
  it("carries three kinds of record: paired, mask-only, and sampled unsegmented frames", () => {
    expect(archiveImageTotal).toBe(2422);
    expect(archiveCounts.completePairs).toBe(1016);
    expect(archiveCounts.maskOnly).toBe(344);
    expect(archiveCounts.sourceOnly).toBe(1062);
    expect(archiveCounts.completePairs + archiveCounts.maskOnly + archiveCounts.sourceOnly).toBe(archiveImageTotal);

    expect(segmentedImageTotal).toBe(archiveCounts.completePairs + archiveCounts.maskOnly);
    expect(images.filter((image) => image.hasSource)).toHaveLength(
      archiveCounts.completePairs + archiveCounts.sourceOnly,
    );
    expect(images.filter((image) => image.hasSource && image.hasMask)).toHaveLength(archiveCounts.completePairs);
  });

  // `cloud_segment` covers a fraction of the delivered frames, so the sample is
  // bounded per sequence and the rest is reported rather than quietly dropped.
  it("samples the unsegmented frames at the declared size and says how many were left out", () => {
    expect(archiveCounts.sampleSizePerSequence).toBe(100);
    expect(archiveCounts.unsegmentedFrames).toBe(16504);
    expect(archiveCounts.unsegmentedFramesLeftOut).toBe(
      archiveCounts.unsegmentedFrames - archiveCounts.sourceOnly,
    );
    for (const videoId of videoIds) {
      const unsegmented = images.filter((image) => image.videoId === videoId && !image.hasMask);
      expect(unsegmented.length).toBeLessThanOrEqual(archiveCounts.sampleSizePerSequence);
    }
  });

  it("groups records into one collection per capture sequence", () => {
    expect(collections).toHaveLength(11);
    expect(videoIds).toHaveLength(11);
    expect(collections.reduce((sum, collection) => sum + collection.images, 0)).toBe(archiveImageTotal);
    expect(collections.reduce((sum, collection) => sum + collection.segmented, 0)).toBe(segmentedImageTotal);
    for (const collection of collections) {
      expect(collection.images).toBeGreaterThan(0);
      expect(collection.segmented).toBeGreaterThan(0);
      expect(collection.segmented).toBeLessThanOrEqual(collection.images);
      expect(collection.image).toMatch(/^\/frames\//);
    }
  });

  it("uses unique, well-formed identifiers", () => {
    const ids = new Set(images.map((image) => image.id));
    expect(ids.size).toBe(images.length);
    for (const image of images) expect(image.id).toMatch(/^WAS-V\d{2}-F\d+$/);
  });

  it("holds the source frame, the mask, or both -- and never neither", () => {
    for (const image of images) {
      const types = image.artifacts.map((artifact) => artifact.type);
      expect(image.artifacts.length).toBeGreaterThan(0);
      expect(image.hasSource || image.hasMask).toBe(true);

      if (image.hasMask) {
        expect(types).toContain("mask");
        expect(image.maskUrl).toMatch(/-mask\.jpg$/);
      } else {
        expect(types).not.toContain("mask");
        expect(image.maskUrl).toBeUndefined();
      }
      if (image.hasSource) {
        expect(types).toContain("source");
        expect(image.sourceUrl).toMatch(/-source\.jpg$/);
      } else {
        expect(types).not.toContain("source");
        expect(image.sourceUrl).toBeUndefined();
      }
      // Listings always have something to show.
      expect(image.image).toBe(image.sourceUrl ?? image.maskUrl);
    }
  });

  // The previous fixture pointed every artifact at the same file, so "download
  // mask" returned the photograph. Guard that specific regression.
  it("never points the source and mask artifacts at the same file", () => {
    for (const image of images.filter((record) => record.hasSource && record.hasMask)) {
      expect(image.sourceUrl).not.toBe(image.maskUrl);
    }
  });

  it("gives every artifact its own checksum and a positive byte size", () => {
    const checksums = new Set<string>();
    for (const image of images) {
      for (const artifact of image.artifacts) {
        expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/);
        expect(artifact.bytes).toBeGreaterThan(0);
        checksums.add(artifact.checksum);
      }
    }
    // Distinct files must not share one hardcoded hash.
    expect(checksums.size).toBeGreaterThan(images.length);
  });

  it("stores measured cloud cover consistent with its okta bucket", () => {
    for (const image of images.filter((record) => record.hasMask)) {
      expect(image.cloudFraction).toBeGreaterThanOrEqual(0);
      expect(image.cloudFraction).toBeLessThanOrEqual(1);
      expect(image.cloudCoverOktas).toBe(oktasFromFraction(image.cloudFraction!));
    }
  });

  // Cloud cover comes from the mask. Without a mask the honest value is no value:
  // reporting 0 oktas would claim a clear sky nobody measured.
  it("reports no cloud cover at all for a frame that has not been segmented", () => {
    const unsegmented = images.filter((image) => !image.hasMask);
    expect(unsegmented).toHaveLength(archiveCounts.sourceOnly);
    for (const image of unsegmented) {
      expect(image.cloudFraction).toBeUndefined();
      expect(image.cloudCoverOktas).toBeUndefined();
      expect(image.tags).toContain("unsegmented");
    }
  });

  it("reports real pixel dimensions matching the delivered imagery", () => {
    for (const image of images) {
      expect(image.width).toBe(640);
      expect(image.height).toBe(360);
    }
  });

  it("serves every artifact from a file that exists on disk", () => {
    for (const image of images) {
      for (const artifact of image.artifacts) {
        expect(existsSync(resolve("public", artifact.objectKey))).toBe(true);
      }
    }
  });

  it("records mask registration per sequence and only where it was needed", () => {
    const corrected = Object.entries(maskRegistration).filter(([, entry]) => entry.corrected);
    for (const [, entry] of corrected) {
      expect(entry.scale).toBeGreaterThan(1);
      expect(entry.cloudOutsideFieldOfView).toBeGreaterThan(0.02);
    }
    for (const [, entry] of Object.entries(maskRegistration).filter(([, value]) => !value.corrected)) {
      expect(entry.scale).toBe(1);
    }
    // Records inherit their sequence's scale, and a record with no mask is
    // trivially registered whatever its sequence needed.
    for (const image of images) {
      expect(image.maskScale).toBe(
        image.hasMask ? maskRegistration[image.videoId as keyof typeof maskRegistration].scale : 1,
      );
    }
  });

  it("omits provenance fields that were never supplied rather than inventing them", () => {
    for (const image of images) {
      for (const key of ["capturedAt", "location", "season", "timeOfDay", "instrument"] as const) {
        if (key in image) expect(image[key]).toBeTruthy();
      }
    }
  });

  it("contains no legacy fixture content", () => {
    expect(JSON.stringify({ collections, images })).not.toMatch(legacyTerms);
  });
});
