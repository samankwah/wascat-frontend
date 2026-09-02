import { describe, expect, it } from "vitest";
import { seasons, timesOfDay } from "../lib/vocab";
import { assertReleaseWritable, normalizeSearchText, validateManifest } from "../lib/manifest";

const sha = "a".repeat(64);
const maskArtifact = {
  type: "mask",
  mediaType: "image/jpeg",
  objectKey: "frames/vid1/100-mask.jpg",
  publicUrl: "/frames/vid1/100-mask.jpg",
  checksum: sha,
  bytes: 100,
  width: 640,
  height: 360,
};
const sourceArtifact = { ...maskArtifact, type: "source", objectKey: "frames/vid1/100-source.jpg", publicUrl: "/frames/vid1/100-source.jpg", checksum: "b".repeat(64) };

const base = {
  schemaVersion: "1.0",
  collection: { slug: "vid1", title: "Capture sequence vid1" },
  release: { version: "1.0" },
  images: [{
    id: "WAS-V01-F100",
    videoId: "vid1",
    frameIndex: 100,
    cloudFraction: 0.5526,
    cloudCoverOktas: 4,
    width: 640,
    height: 360,
    provenance: { pipeline: "cloud-segmentation" },
    artifacts: [sourceArtifact, maskArtifact],
  }],
};

describe("release manifest", () => {
  it("accepts a measured record with no editorial provenance", () => {
    const manifest = validateManifest(base);
    expect(manifest.images).toHaveLength(1);
    expect(manifest.collection.license).toBeUndefined();
    expect(manifest.images[0].capturedAt).toBeUndefined();
  });

  it("accepts a mask-only record", () => {
    const manifest = validateManifest({ ...base, images: [{ ...base.images[0], artifacts: [maskArtifact] }] });
    expect(manifest.images[0].artifacts).toHaveLength(1);
  });

  // Both delivered sets are partial, so a record may hold either half -- but a
  // cloud-cover figure only means something next to the mask it came from.
  it("accepts a source-only record that reports no cloud cover", () => {
    const manifest = validateManifest({
      ...base,
      images: [{ ...base.images[0], cloudFraction: undefined, cloudCoverOktas: undefined, artifacts: [sourceArtifact] }],
    });
    expect(manifest.images[0].artifacts).toHaveLength(1);
    expect(manifest.images[0].cloudFraction).toBeUndefined();
    expect(manifest.images[0].cloudCoverOktas).toBeUndefined();
  });

  it("rejects cloud cover reported without a mask to measure it from", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], artifacts: [sourceArtifact] }] }))
      .toThrow(/cloud cover without a mask/);
  });

  it("rejects a cloud fraction without its okta bucket, and vice versa", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], cloudCoverOktas: undefined }] }))
      .toThrow(/cloud fraction and oktas together/);
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], cloudFraction: undefined }] }))
      .toThrow(/cloud fraction and oktas together/);
  });

  it("rejects a record with no artifacts at all", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], artifacts: [] }] })).toThrow();
  });

  it("accepts editorial provenance once supplied", () => {
    const manifest = validateManifest({
      ...base,
      collection: { ...base.collection, license: "CC BY 4.0", citation: "WASCAT (2026).", doi: "10.1234/example" },
      images: [{
        ...base.images[0],
        capturedAt: "2026-03-14T09:00:00Z",
        location: "Kumasi, Ghana",
        coordinates: { latitude: 6.6885, longitude: -1.6244 },
        season: "Transition",
        timeOfDay: "Morning",
        instrument: "All-sky camera",
      }],
    });
    expect(manifest.collection.doi).toBe("10.1234/example");
    expect(manifest.images[0].location).toBe("Kumasi, Ghana");
  });

  it("accepts every supported season and time of day", () => {
    for (const season of seasons) {
      for (const timeOfDay of timesOfDay) {
        expect(validateManifest({ ...base, images: [{ ...base.images[0], season, timeOfDay }] }).images[0]).toMatchObject({ season, timeOfDay });
      }
    }
  });

  it("rejects temperate season labels", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], season: "Winter" }] })).toThrow();
  });

  it("bounds the measured fields", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], cloudFraction: 1.2 }] })).toThrow();
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], cloudCoverOktas: 9 }] })).toThrow();
  });

  it("requires a sequence identity on every record", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], videoId: "video1" }] })).toThrow();
  });

  it("rejects artifact dimensions that disagree with the record", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], artifacts: [{ ...maskArtifact, width: 320 }] }] })).toThrow(/dimensions do not match/);
  });

  it("rejects duplicate identifiers", () => {
    expect(() => validateManifest({ ...base, images: [base.images[0], base.images[0]] })).toThrow(/Duplicate image/);
  });

  it("rejects a repeated artifact type", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], artifacts: [maskArtifact, maskArtifact] }] })).toThrow(/Duplicate artifact type/);
  });

  it("enforces release immutability", () => {
    expect(() => assertReleaseWritable("PUBLISHED")).toThrow(/immutable/);
    expect(() => assertReleaseWritable("DRAFT")).not.toThrow();
  });

  it("builds searchable text from the fields a record actually has", () => {
    expect(normalizeSearchText(validateManifest(base).images[0])).toContain("vid1");
  });
});
