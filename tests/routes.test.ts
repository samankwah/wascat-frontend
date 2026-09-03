/**
 * Route metadata, and what the pages ask the API for.
 *
 * The pages no longer hold the archive, so these run against the mocked API.
 * That makes the requests themselves worth asserting: with filtering server
 * side, "did the page ask for the right thing" is where the bugs now live.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import * as imagePage from "@/app/(site)/images/[id]/page";
import { generateMetadata as collectionMetadata } from "@/app/(site)/collections/[slug]/page";
import { generateMetadata as imageMetadata } from "@/app/(site)/images/[id]/page";

import { installApiMock, MASK_ONLY, PAIRED, UNSEGMENTED, type RequestLog } from "./support/api-mock";

let requests: RequestLog;
let restore: () => void;

beforeEach(() => {
  ({ requests, restore } = installApiMock());
});

afterEach(() => restore());

describe("static generation", () => {
  // Was: "pre-renders one route per collection". Inverted deliberately.
  //
  // generateStaticParams runs at build time, which would mean `next build`
  // could not finish without a reachable database - coupling CI and the
  // container build to the API in order to pre-render eleven pages. They are
  // rendered on demand and cached instead, and a dashboard edit invalidates
  // them through /api/revalidate, which also makes an edit visible sooner
  // than waiting for a rebuild.
  it("does not pre-render collection pages", async () => {
    const collectionPage = await import("@/app/(site)/collections/[slug]/page");
    expect("generateStaticParams" in collectionPage).toBe(false);
  });

  // Unchanged: pre-rendering one page per frame would put the whole archive
  // into the build output, and the archive is the thing that grows.
  it("does not pre-render a page per record", () => {
    expect("generateStaticParams" in imagePage).toBe(false);
  });
});

describe("collection metadata", () => {
  it("comes from the collection the API returns", async () => {
    const metadata = await collectionMetadata({ params: Promise.resolve({ slug: "vid1" }) });
    expect(metadata.title).toBe("Capture sequence vid1");
    expect(metadata.description).toMatch(/all-sky frames from capture sequence vid1/);
    expect(requests[0].url).toBe("/api/v1/collections/vid1");
  });

  it("degrades to a generic title when the collection is gone", async () => {
    const metadata = await collectionMetadata({
      params: Promise.resolve({ slug: "reykjavik-all-sky" }),
    });
    expect(metadata.title).toBe("Collection");
  });
});

describe("record metadata describes what the record actually holds", () => {
  it("names a paired frame as a camera frame with its measurement", async () => {
    const metadata = await imageMetadata({ params: Promise.resolve({ id: PAIRED.id }) });
    expect(metadata.title).toBe(PAIRED.id);
    expect(metadata.description).toMatch(/All-sky camera frame/);
    expect(metadata.description).toMatch(/cloud cover/);
  });

  it("names a mask-only record as a mask", async () => {
    const metadata = await imageMetadata({ params: Promise.resolve({ id: MASK_ONLY.id }) });
    expect(metadata.description).toMatch(/Binary cloud segmentation mask/);
  });

  it("claims no cover for a frame nobody has measured", async () => {
    const metadata = await imageMetadata({ params: Promise.resolve({ id: UNSEGMENTED.id }) });
    expect(metadata.description).toMatch(/not yet segmented/);
    expect(metadata.description).not.toMatch(/cloud cover/);
  });
});
