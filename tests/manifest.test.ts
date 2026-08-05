import { describe, expect, it } from "vitest";
import { seasons, skyClasses } from "../lib/catalog";
import { assertReleaseWritable, normalizeSearchText, validateManifest } from "../lib/manifest";

const sha = "a".repeat(64);
const base = {
  schemaVersion: "1.0",
  collection: { slug: "test-clouds", title: "Test Clouds", license: "CC BY 4.0", citation: "Demonstration fixture (2026)." },
  release: { version: "1.0", bundleUrl: "https://cdn.example.org/test.zip", bundleChecksum: sha },
  images: [{ id: "WAS-TEST-001", capturedAt: "2025-01-01T12:00:00Z", location: "Kumasi, Ghana", skyClass: "Cumulus", season: "Wet season", timeOfDay: "Midday", width: 100, height: 100, instrument: "Demonstration camera", provenance: { pipeline: "1.0-demo" }, artifacts: [{ type: "source", mediaType: "image/png", objectKey: "source.png", publicUrl: "https://cdn.example.org/source.png", checksum: sha, bytes: 100, width: 100, height: 100 }] }],
};

describe("release manifest", () => {
  it("accepts a normalized complete manifest without a DOI", () => {
    const manifest = validateManifest(base);
    expect(manifest.images).toHaveLength(1);
    expect(manifest.collection.doi).toBeUndefined();
  });

  it("accepts optional DOI metadata when supplied", () => {
    expect(validateManifest({ ...base, collection: { ...base.collection, doi: "10.1234/example" } }).collection.doi).toBe("10.1234/example");
  });

  it("accepts every supported class and regional season", () => {
    for (const skyClass of skyClasses) {
      for (const season of seasons) {
        expect(validateManifest({ ...base, images: [{ ...base.images[0], skyClass, season }] }).images[0]).toMatchObject({ skyClass, season });
      }
    }
  });

  it("rejects temperate season labels", () => {
    expect(() => validateManifest({ ...base, images: [{ ...base.images[0], season: "Winter" }] })).toThrow();
  });

  it("rejects duplicate identifiers", () => { expect(() => validateManifest({ ...base, images: [base.images[0], base.images[0]] })).toThrow(/Duplicate image/); });
  it("enforces release immutability", () => { expect(() => assertReleaseWritable("PUBLISHED")).toThrow(/immutable/); expect(() => assertReleaseWritable("DRAFT")).not.toThrow(); });
  it("builds searchable regional text", () => { expect(normalizeSearchText(validateManifest(base).images[0])).toContain("kumasi, ghana"); });
});
