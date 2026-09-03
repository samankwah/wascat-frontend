/**
 * The data layer.
 *
 * Replaces the old catalog.test.ts, which asserted the size and content of a
 * bundled JSON file. That subject matter moved to the backend, where it is
 * checked against a real database and against the responses recorded from
 * this app before the migration.
 *
 * What remains here is the frontend's own responsibility: asking for the right
 * thing, reading the envelope, and treating a missing record as a missing
 * record rather than a crash.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ApiRequestError,
  getArchiveStats,
  getCollection,
  getCollectionImages,
  getCollections,
  getFacets,
  getImage,
  getImages,
} from "@/lib/api-client";

import { installApiMock, MASK_ONLY, PAIRED, UNSEGMENTED, type RequestLog } from "./support/api-mock";

let requests: RequestLog;
let restore: () => void;

beforeEach(() => {
  ({ requests, restore } = installApiMock());
});

afterEach(() => restore());

describe("reading image records", () => {
  it("returns the page and the total the filter matched", async () => {
    const page = await getImages({ limit: 2 });
    expect(page.records).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(page.limit).toBe(2);
    expect(page.nextCursor).toBe("next-page-cursor");
  });

  it("reports no next cursor on the last page", async () => {
    const page = await getImages({ limit: 50 });
    expect(page.nextCursor).toBeNull();
  });

  it("forwards filters to the API rather than filtering locally", async () => {
    await getImages({ collection: "vid1", segmented: "true", limit: 3 });
    const [request] = requests;
    expect(request.url).toBe("/api/v1/images");
    expect(request.params.get("collection")).toBe("vid1");
    expect(request.params.get("segmented")).toBe("true");
    expect(request.params.get("limit")).toBe("3");
  });

  it("omits empty and undefined parameters", async () => {
    await getImages({ q: "", collection: undefined, limit: 5 });
    const [request] = requests;
    expect(request.params.has("q")).toBe(false);
    expect(request.params.has("collection")).toBe(false);
    expect(request.params.get("limit")).toBe("5");
  });

  it("fetches one record by id", async () => {
    const record = await getImage(PAIRED.id);
    expect(record?.id).toBe(PAIRED.id);
    expect(record?.hasSource).toBe(true);
    expect(record?.hasMask).toBe(true);
  });

  it("returns null for a record that does not exist", async () => {
    // A 404 is an ordinary outcome the page renders as not-found, not an
    // exception to handle.
    await expect(getImage("WAS-RKV-00000")).resolves.toBeNull();
  });

  it("scopes a sequence request to its collection", async () => {
    const records = await getCollectionImages("vid1", { limit: 4 });
    expect(records.every((record) => record.collection === "vid1")).toBe(true);
    expect(requests[0].params.get("collection")).toBe("vid1");
  });
});

describe("what a record does and does not claim", () => {
  it("keeps a measurement on a frame that carries a mask", async () => {
    const record = await getImage(PAIRED.id);
    expect(record?.cloudCoverOktas).toBe(4);
    expect(record?.cloudFraction).toBeCloseTo(0.525588, 6);
  });

  it("reports no cover at all for an unsegmented frame", async () => {
    // Not zero. Cover is measured from the mask, and a zero here would show
    // the reader a clear sky nobody observed.
    const record = await getImage(UNSEGMENTED.id);
    expect(record?.cloudCoverOktas).toBeUndefined();
    expect(record?.cloudFraction).toBeUndefined();
    expect(record?.tags).toContain("unsegmented");
  });

  it("keeps the delivered mask scale so the viewer can correct the overlay", async () => {
    const record = await getImage(MASK_ONLY.id);
    expect(record?.maskScale).toBeCloseTo(1.146497, 6);
    expect(record?.hasSource).toBe(false);
  });
});

describe("collections", () => {
  it("lists collections with their current release", async () => {
    const collections = await getCollections();
    expect(collections).toHaveLength(1);
    expect(collections[0].currentRelease?.version).toBe("1.0");
  });

  it("fetches one collection with its release history", async () => {
    const collection = await getCollection("vid1");
    expect(collection?.slug).toBe("vid1");
    expect(collection?.releases[0].current).toBe(true);
  });

  it("returns null for an unknown slug", async () => {
    await expect(getCollection("reykjavik-all-sky")).resolves.toBeNull();
  });
});

describe("facets and archive totals", () => {
  it("emits every bucket of a closed vocabulary, including the empty ones", async () => {
    const facets = await getFacets();
    // All nine oktas, so the filter list is stable rather than appearing and
    // disappearing as the archive changes.
    expect(facets.cloudCoverOktas).toHaveLength(9);
    expect(facets.seasons).toHaveLength(4);
    expect(facets.timesOfDay).toHaveLength(4);
  });

  it("leaves an open-ended vocabulary empty until it has values", async () => {
    const facets = await getFacets();
    expect(facets.locations).toEqual([]);
  });

  it("derives archive totals from the segmentation split", async () => {
    const stats = await getArchiveStats();
    expect(stats.segmented).toBe(223);
    expect(stats.unsegmented).toBe(100);
    expect(stats.total).toBe(323);
    expect(stats.sequences).toEqual(["vid1"]);
  });

  it("knows no frame carries a capture time yet", async () => {
    // Asked by filtering from a date older than any capture: a date filter
    // excludes frames without one, so the total it reports is the count of
    // frames that have one.
    const stats = await getArchiveStats();
    expect(stats.hasTimestamps).toBe(false);
    expect(requests.some((request) => request.params.get("from") === "1970-01-01")).toBe(true);
  });
});

describe("when the API fails", () => {
  it("raises with the API's own message", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: { code: "invalid_query", message: "Bad okta" } }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch;

    await expect(getImages({ oktas: 9 })).rejects.toThrow(ApiRequestError);
    await expect(getImages({ oktas: 9 })).rejects.toThrow("Bad okta");
  });

  it("falls back to the status line when the body is not JSON", async () => {
    globalThis.fetch = (async () =>
      new Response("<html>502</html>", { status: 502, statusText: "Bad Gateway" })) as unknown as typeof fetch;

    await expect(getImages()).rejects.toThrow(/502/);
  });
});
