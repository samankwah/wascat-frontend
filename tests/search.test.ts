import { describe, expect, it } from "vitest";
import { collections, images, segmentedImageTotal, videoIds } from "../lib/catalog";
import { oktaValues } from "../lib/vocab";
import { decodeCursor, encodeCursor, filterImages, imageQuerySchema } from "../lib/search";

describe("catalog filters and cursors", () => {
  it("combines sequence, cloud-cover range, and artifact filters", () => {
    const query = imageQuerySchema.parse({ video: "vid1", oktasMin: 4, oktasMax: 6, artifact: "source" });
    const result = filterImages(images, query);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item.videoId).toBe("vid1");
      expect(item.cloudCoverOktas).toBeGreaterThanOrEqual(4);
      expect(item.cloudCoverOktas).toBeLessThanOrEqual(6);
      expect(item.hasSource).toBe(true);
      expect(item.hasMask).toBe(true);
    }
  });

  it.each(videoIds)("filters the %s sequence", (video) => {
    const result = filterImages(images, imageQuerySchema.parse({ video }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.videoId === video)).toBe(true);
  });

  it.each(collections.map((collection) => collection.slug))("filters the %s collection", (collection) => {
    const result = filterImages(images, imageQuerySchema.parse({ collection }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.collection === collection)).toBe(true);
  });

  // The okta scale partitions the segmented records only. An unsegmented frame
  // has no measurement, so it belongs in no bucket -- not in the 0-okta one.
  it("partitions the segmented records across the okta scale", () => {
    const total = oktaValues.reduce<number>(
      (sum, oktas) => sum + filterImages(images, imageQuerySchema.parse({ oktas })).length,
      0,
    );
    expect(total).toBe(segmentedImageTotal);
    expect(total).toBeLessThan(images.length);
  });

  it("excludes unsegmented frames from every cloud-cover filter", () => {
    // A range spanning the whole scale still reaches only the measured records.
    for (const query of [{ oktasMin: 0 }, { oktasMax: 8 }, { oktasMin: 0, oktasMax: 8 }]) {
      const result = filterImages(images, imageQuerySchema.parse(query));
      expect(result).toHaveLength(segmentedImageTotal);
      expect(result.every((item) => item.hasMask)).toBe(true);
    }
    // And no single bucket picks one up either.
    for (const oktas of oktaValues) {
      expect(filterImages(images, imageQuerySchema.parse({ oktas })).every((item) => item.hasMask)).toBe(true);
    }
  });

  it("splits the catalog on whether a frame has been segmented", () => {
    const segmented = filterImages(images, imageQuerySchema.parse({ segmented: "true" }));
    const unsegmented = filterImages(images, imageQuerySchema.parse({ segmented: "false" }));
    expect(segmented).toHaveLength(segmentedImageTotal);
    expect(segmented.length + unsegmented.length).toBe(images.length);
    expect(segmented.every((item) => item.hasMask)).toBe(true);
    expect(unsegmented.every((item) => !item.hasMask && item.hasSource)).toBe(true);
  });

  it("filters by required artifact", () => {
    expect(filterImages(images, imageQuerySchema.parse({ artifact: "mask" }))).toHaveLength(segmentedImageTotal);
    expect(filterImages(images, imageQuerySchema.parse({ artifact: "source" }))).toHaveLength(
      images.filter((image) => image.hasSource).length,
    );
  });

  it("matches a record by identifier, and free text matches as a substring", () => {
    const sample = images[0];
    const byId = filterImages(images, imageQuerySchema.parse({ q: sample.id }));
    expect(byId.map((item) => item.id)).toContain(sample.id);

    // Free text is a substring match, so "vid1" also reaches vid10 and vid11.
    // The exact-sequence filter is what narrows to a single sequence.
    const byText = filterImages(images, imageQuerySchema.parse({ q: "vid1" }));
    expect(byText.every((item) => item.videoId.startsWith("vid1"))).toBe(true);
    expect(new Set(byText.map((item) => item.videoId)).size).toBeGreaterThan(1);

    const bySequence = filterImages(images, imageQuerySchema.parse({ video: "vid1" }));
    expect(bySequence.every((item) => item.videoId === "vid1")).toBe(true);
  });

  it("orders deterministically and reversibly", () => {
    const newest = filterImages(images, imageQuerySchema.parse({ sort: "newest" }));
    const oldest = filterImages(images, imageQuerySchema.parse({ sort: "oldest" }));
    expect(newest).toHaveLength(images.length);
    expect(newest[0].id).toBe(oldest[oldest.length - 1].id);
  });

  it("pages through the catalog without gaps or repeats", () => {
    const query = imageQuerySchema.parse({ limit: 100 });
    const all = filterImages(images, query);
    const seen: string[] = [];
    for (let offset = 0; offset < all.length; offset += query.limit) {
      seen.push(...all.slice(decodeCursor(encodeCursor(offset)), offset + query.limit).map((item) => item.id));
    }
    expect(seen).toHaveLength(all.length);
    expect(new Set(seen).size).toBe(all.length);
  });

  it("round trips opaque offsets", () => { expect(decodeCursor(encodeCursor(42))).toBe(42); });
  it("bounds page limits", () => { expect(imageQuerySchema.safeParse({ limit: 101 }).success).toBe(false); });
  it("bounds the okta scale", () => { expect(imageQuerySchema.safeParse({ oktas: 9 }).success).toBe(false); });
  it("rejects malformed sequence identifiers", () => { expect(imageQuerySchema.safeParse({ video: "video1" }).success).toBe(false); });
  it("rejects legacy season values", () => { expect(imageQuerySchema.safeParse({ season: "Summer" }).success).toBe(false); });
  it("rejects a non-boolean segmentation flag", () => { expect(imageQuerySchema.safeParse({ segmented: "maybe" }).success).toBe(false); });
});
