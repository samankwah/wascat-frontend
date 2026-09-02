import { describe, expect, it } from "vitest";
import { GET as getCollection } from "../app/api/v1/collections/[slug]/route";
import { GET as getCollections } from "../app/api/v1/collections/route";
import { GET as getFacets } from "../app/api/v1/facets/route";
import { GET as getImage } from "../app/api/v1/images/[id]/route";
import { GET as getImages } from "../app/api/v1/images/route";
import { collections, images, segmentedImageTotal, videoIds } from "../lib/catalog";
import { oktaValues } from "../lib/vocab";

const legacyTerms = /reyk|iceland|north atlantic|polar|akureyri|faxaf|WAS-(RKV|NAS|PCR)|winter|spring|summer|autumn/i;

describe("catalog API", () => {
  it("returns one entry per capture sequence in a stable envelope", async () => {
    const response = await getCollections(new Request("https://wascat.example.org/api/v1/collections"));
    const body = await response.json();
    expect(body.data).toHaveLength(collections.length);
    expect(body.meta).toMatchObject({ apiVersion: "1.0", count: collections.length });
    expect(body.links.self).toBe("https://wascat.example.org/api/v1/collections");
    expect(JSON.stringify(body)).not.toMatch(legacyTerms);
  });

  it("exposes measured cloud-cover, sequence, and artifact facets", async () => {
    const response = await getFacets(new Request("https://wascat.example.org/api/v1/facets"));
    const body = await response.json();
    expect(body.data.cloudCoverOktas.map(({ value }: { value: number }) => value)).toEqual([...oktaValues]);
    expect(body.data.sequences.map(({ value }: { value: string }) => value)).toEqual(videoIds);
    // Facet counts describe the real catalogue. Cloud cover is measured from the
    // mask, so its buckets cover the segmented records and nothing else.
    const oktaTotal = body.data.cloudCoverOktas.reduce((sum: number, entry: { count: number }) => sum + entry.count, 0);
    expect(oktaTotal).toBe(segmentedImageTotal);
    expect(body.data.artifacts.find(({ value }: { value: string }) => value === "mask").count).toBe(segmentedImageTotal);
    expect(body.data.artifacts.find(({ value }: { value: string }) => value === "source").count).toBe(
      images.filter((image) => image.hasSource).length,
    );
    const segmentation = body.data.segmentation as { value: string; count: number }[];
    expect(segmentation.reduce((sum, entry) => sum + entry.count, 0)).toBe(images.length);
    expect(segmentation.find(({ value }) => value === "segmented")!.count).toBe(segmentedImageTotal);
    expect(JSON.stringify(body)).not.toMatch(legacyTerms);
  });

  it("reports zero counts for provenance fields that have not been supplied", async () => {
    const response = await getFacets(new Request("https://wascat.example.org/api/v1/facets"));
    const body = await response.json();
    for (const entry of body.data.seasons) expect(entry.count).toBe(0);
    expect(body.data.locations).toEqual([]);
  });

  it("filters image responses by sequence and measured cloud cover", async () => {
    const request = new Request("https://wascat.example.org/api/v1/images?video=vid1&oktasMin=4&oktasMax=5&artifact=source&limit=5");
    const response = await getImages(request);
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const record of body.data) {
      expect(record.videoId).toBe("vid1");
      expect(record.cloudCoverOktas).toBeGreaterThanOrEqual(4);
      expect(record.cloudCoverOktas).toBeLessThanOrEqual(5);
    }
    expect(body.meta).toMatchObject({ apiVersion: "1.0", limit: 5 });
  });

  it("paginates with an opaque cursor", async () => {
    const first = await (await getImages(new Request("https://wascat.example.org/api/v1/images?limit=10"))).json();
    expect(first.meta.total).toBe(images.length);
    expect(first.meta.nextCursor).toBeTruthy();
    const second = await (await getImages(new Request(first.links.next))).json();
    expect(second.data).toHaveLength(10);
    const firstIds = first.data.map((record: { id: string }) => record.id);
    expect(second.data.some((record: { id: string }) => firstIds.includes(record.id))).toBe(false);
  });

  it("serves an unsegmented frame with its source file and no cloud cover", async () => {
    const sample = images.find((image) => !image.hasMask)!;
    const response = await getImage(new Request(`https://wascat.example.org/api/v1/images/${sample.id}`), { params: Promise.resolve({ id: sample.id }) });
    const body = await response.json();
    expect(body.data.artifacts.map(({ type }: { type: string }) => type)).toEqual(["source"]);
    expect(body.data.cloudCoverOktas).toBeUndefined();
    expect(body.data.cloudFraction).toBeUndefined();
  });

  it("rejects an out-of-range cloud-cover query", async () => {
    const response = await getImages(new Request("https://wascat.example.org/api/v1/images?oktas=9"));
    expect(response.status).toBe(400);
  });

  it("serves a single record with its real artifact paths", async () => {
    const sample = images.find((image) => image.hasSource && image.hasMask)!;
    const response = await getImage(new Request(`https://wascat.example.org/api/v1/images/${sample.id}`), { params: Promise.resolve({ id: sample.id }) });
    const body = await response.json();
    expect(body.data.id).toBe(sample.id);
    const urls = body.data.artifacts.map((artifact: { url: string }) => artifact.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("returns 404 for unknown collection and record URLs", async () => {
    const missingCollection = await getCollection(new Request("https://wascat.example.org/api/v1/collections/reykjavik-all-sky"), { params: Promise.resolve({ slug: "reykjavik-all-sky" }) });
    const missingImage = await getImage(new Request("https://wascat.example.org/api/v1/images/WAS-RKV-20240718-121530"), { params: Promise.resolve({ id: "WAS-RKV-20240718-121530" }) });
    expect(missingCollection.status).toBe(404);
    expect(missingImage.status).toBe(404);
  });
});
