import { describe, expect, it } from "vitest";
import { archiveImageTotal, collections, images, locations, seasons, skyClasses } from "../lib/catalog";

const expectedCollections = {
  "kumasi-convective-skies": { images: 10842, prefix: "WAS-KMS", location: "Kumasi, Ghana" },
  "gulf-of-guinea-coastal-clouds": { images: 7426, prefix: "WAS-LOS", location: "Lagos, Nigeria" },
  "sahel-sky-observatory": { images: 4701, prefix: "WAS-OUA", location: "Ouagadougou, Burkina Faso" },
} as const;

const legacyTerms = /reyk|iceland|north atlantic|polar|akureyri|faxaf|WAS-(RKV|NAS|PCR)|winter|spring|summer|autumn/i;

describe("West African demonstration catalog", () => {
  it("contains exactly the three planned collections totalling 22,969 images", () => {
    expect(collections).toHaveLength(3);
    expect(archiveImageTotal).toBe(22969);
    expect(Object.fromEntries(collections.map((collection) => [collection.slug, collection.images]))).toEqual(Object.fromEntries(Object.entries(expectedCollections).map(([slug, value]) => [slug, value.images])));
  });

  it("keeps every record inside its regional collection with the correct prefix and location", () => {
    for (const image of images) {
      const expected = expectedCollections[image.collection as keyof typeof expectedCollections];
      expect(expected).toBeDefined();
      expect(image.id.startsWith(expected.prefix)).toBe(true);
      expect(image.location).toBe(expected.location);
    }
  });

  it("exposes all nine classes, four regional seasons, and three catalog-derived locations", () => {
    expect(new Set(images.map((image) => image.skyClass))).toEqual(new Set(skyClasses));
    expect(new Set(images.map((image) => image.season))).toEqual(new Set(seasons));
    expect(locations).toEqual(["Kumasi, Ghana", "Lagos, Nigeria", "Ouagadougou, Burkina Faso"]);
  });

  it("marks citations as demonstrations and does not invent DOI metadata", () => {
    for (const collection of collections) {
      expect(collection.citation).toMatch(/demonstration/i);
      expect(collection.doi).toBeUndefined();
    }
  });

  it("contains no legacy fixture content", () => {
    expect(JSON.stringify({ collections, images })).not.toMatch(legacyTerms);
  });
});
