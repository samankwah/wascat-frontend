import { describe, expect, it } from "vitest";
import { collections, images, locations, seasons, skyClasses } from "../lib/catalog";
import { decodeCursor, encodeCursor, filterImages, imageQuerySchema } from "../lib/search";

describe("catalog filters and cursors", () => {
  it("combines collection, season, location, class, artifact, and date filters", () => {
    const query = imageQuerySchema.parse({
      collection: "sahel-sky-observatory",
      season: "Harmattan",
      location: "Ouagadougou, Burkina Faso",
      class: "Clear",
      artifact: "mask",
      from: "2025-01-01",
      to: "2025-01-31",
    });
    const result = filterImages(images, query);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ collection: query.collection, season: query.season, location: query.location, skyClass: query.class });
  });

  it.each(skyClasses)("filters the %s class", (skyClass) => {
    const result = filterImages(images, imageQuerySchema.parse({ class: skyClass }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.skyClass === skyClass)).toBe(true);
  });

  it.each(seasons)("filters the %s season", (season) => {
    const result = filterImages(images, imageQuerySchema.parse({ season }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.season === season)).toBe(true);
  });

  it.each(locations)("filters the %s location", (location) => {
    const result = filterImages(images, imageQuerySchema.parse({ location }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.location === location)).toBe(true);
  });

  it.each(collections.map((collection) => collection.slug))("filters the %s collection", (collection) => {
    const result = filterImages(images, imageQuerySchema.parse({ collection }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.collection === collection)).toBe(true);
  });

  it("matches an ISO capture date entered as a search term", () => {
    const query = imageQuerySchema.parse({ q: "2024-07-18" });
    const result = filterImages(images, query);
    expect(result).toHaveLength(1);
    expect(result[0].capturedAt.startsWith(query.q ?? "")).toBe(true);
  });

  it("round trips opaque offsets", () => { expect(decodeCursor(encodeCursor(42))).toBe(42); });
  it("bounds page limits", () => { expect(imageQuerySchema.safeParse({ limit: 101 }).success).toBe(false); });
  it("rejects legacy season values", () => { expect(imageQuerySchema.safeParse({ season: "Summer" }).success).toBe(false); });
});
