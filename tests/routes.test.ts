import { describe, expect, it } from "vitest";
import * as imagePage from "../app/images/[id]/page";
import { generateMetadata as collectionMetadata, generateStaticParams as collectionParams } from "../app/collections/[slug]/page";
import { generateMetadata as imageMetadata } from "../app/images/[id]/page";
import { collections, images } from "../lib/catalog";

describe("routes and metadata", () => {
  it("pre-renders one route per collection", () => {
    expect(collectionParams()).toEqual(collections.map(({ slug }) => ({ slug })));
    expect(collectionParams()).not.toContainEqual({ slug: "reykjavik-all-sky" });
  });

  // Record pages render on demand; pre-rendering one page per frame would put
  // the whole catalogue into the build output.
  it("does not pre-render a page per record", () => {
    expect("generateStaticParams" in imagePage).toBe(false);
  });

  it("builds collection metadata from the real sequence", async () => {
    const collection = collections[0];
    const metadata = await collectionMetadata({ params: Promise.resolve({ slug: collection.slug }) });
    expect(metadata.title).toBe(collection.title);
    expect(metadata.description).toBe(collection.description);
  });

  it("builds record metadata describing what the record actually holds", async () => {
    const paired = images.find((image) => image.hasSource && image.hasMask)!;
    const paired_metadata = await imageMetadata({ params: Promise.resolve({ id: paired.id }) });
    expect(paired_metadata.title).toBe(paired.id);
    expect(paired_metadata.description).toMatch(/All-sky camera frame/);

    const maskOnly = images.find((image) => !image.hasSource)!;
    const maskOnlyMetadata = await imageMetadata({ params: Promise.resolve({ id: maskOnly.id }) });
    expect(maskOnlyMetadata.description).toMatch(/Binary cloud segmentation mask/);

    const unsegmented = images.find((image) => !image.hasMask)!;
    const unsegmentedMetadata = await imageMetadata({ params: Promise.resolve({ id: unsegmented.id }) });
    expect(unsegmentedMetadata.description).toMatch(/not yet segmented/);
    // No cover is claimed for a frame nobody measured.
    expect(unsegmentedMetadata.description).not.toMatch(/cloud cover/);
  });
});
