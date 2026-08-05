import { describe, expect, it } from "vitest";
import { GET as getCollection } from "../app/api/v1/collections/[slug]/route";
import { GET as getCollections } from "../app/api/v1/collections/route";
import { GET as getFacets } from "../app/api/v1/facets/route";
import { GET as getImage } from "../app/api/v1/images/[id]/route";
import { GET as getImages } from "../app/api/v1/images/route";
import { seasons, skyClasses } from "../lib/catalog";

const legacyTerms = /reyk|iceland|north atlantic|polar|akureyri|faxaf|WAS-(RKV|NAS|PCR)|winter|spring|summer|autumn/i;

describe("regional API fixtures", () => {
  it("keeps response envelopes while returning only regional collections", async () => {
    const response = await getCollections(new Request("https://wascat.example.org/api/v1/collections"));
    const body = await response.json();
    expect(body.data).toHaveLength(3);
    expect(body.meta).toMatchObject({ apiVersion: "1.0", count: 3 });
    expect(body.links.self).toBe("https://wascat.example.org/api/v1/collections");
    expect(JSON.stringify(body)).not.toMatch(legacyTerms);
  });

  it("exposes canonical class, season, and location facets", async () => {
    const response = await getFacets(new Request("https://wascat.example.org/api/v1/facets"));
    const body = await response.json();
    expect(body.data.skyClasses.map(({ value }: { value: string }) => value)).toEqual(skyClasses);
    expect(body.data.seasons.map(({ value }: { value: string }) => value)).toEqual(seasons);
    expect(body.data.locations.map(({ value }: { value: string }) => value)).toEqual(["Kumasi, Ghana", "Lagos, Nigeria", "Ouagadougou, Burkina Faso"]);
    expect(JSON.stringify(body)).not.toMatch(legacyTerms);
  });

  it("filters image responses with combined regional parameters", async () => {
    const request = new Request("https://wascat.example.org/api/v1/images?collection=sahel-sky-observatory&season=Harmattan&class=Clear&location=Ouagadougou%2C+Burkina+Faso&artifact=mask&from=2025-01-01&to=2025-01-31");
    const response = await getImages(request);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("WAS-OUA-20250108-093300");
    expect(body.meta).toMatchObject({ apiVersion: "1.0", total: 1 });
    expect(JSON.stringify(body)).not.toMatch(legacyTerms);
  });

  it("omits DOI metadata when a collection has no real DOI", async () => {
    const response = await getCollection(new Request("https://wascat.example.org/api/v1/collections/kumasi-convective-skies"), { params: Promise.resolve({ slug: "kumasi-convective-skies" }) });
    const body = await response.json();
    expect(body.data.citation).toMatch(/demonstration/i);
    expect(body.data).not.toHaveProperty("doi");
  });

  it("returns 404 for legacy collection and record URLs", async () => {
    const oldCollection = await getCollection(new Request("https://wascat.example.org/api/v1/collections/reykjavik-all-sky"), { params: Promise.resolve({ slug: "reykjavik-all-sky" }) });
    const oldImage = await getImage(new Request("https://wascat.example.org/api/v1/images/WAS-RKV-20240718-121530"), { params: Promise.resolve({ id: "WAS-RKV-20240718-121530" }) });
    expect(oldCollection.status).toBe(404);
    expect(oldImage.status).toBe(404);
  });
});
