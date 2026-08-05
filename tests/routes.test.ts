import { describe, expect, it } from "vitest";
import { generateMetadata as collectionMetadata, generateStaticParams as collectionParams } from "../app/collections/[slug]/page";
import { generateMetadata as imageMetadata, generateStaticParams as imageParams } from "../app/images/[id]/page";
import { collections, images } from "../lib/catalog";

describe("regional static routes and metadata", () => {
  it("generates only current collection fixture routes", () => {
    expect(collectionParams()).toEqual(collections.map(({ slug }) => ({ slug })));
    expect(collectionParams()).not.toContainEqual({ slug: "reykjavik-all-sky" });
  });

  it("generates only regional image routes", () => {
    expect(imageParams()).toEqual(images.map(({ id }) => ({ id })));
    expect(imageParams().every(({ id }) => /^WAS-(KMS|LOS|OUA)-/.test(id))).toBe(true);
  });

  it("builds collection metadata from regional catalog copy", async () => {
    const metadata = await collectionMetadata({ params: Promise.resolve({ slug: "gulf-of-guinea-coastal-clouds" }) });
    expect(metadata.title).toBe("Gulf of Guinea Coastal Clouds");
    expect(metadata.description).toMatch(/Lagos/i);
  });

  it("builds record metadata with regional alternative text", async () => {
    const metadata = await imageMetadata({ params: Promise.resolve({ id: "WAS-OUA-20250108-093300" }) });
    expect(metadata.title).toBe("WAS-OUA-20250108-093300");
    expect(metadata.description).toMatch(/Ouagadougou, Burkina Faso/);
    expect(metadata.description).toMatch(/demonstration/i);
  });
});
