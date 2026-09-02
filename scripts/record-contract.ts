/**
 * Records the live public API contract to JSON fixtures.
 *
 * The catalogue is moving from a bundled JSON blob served by Next.js route
 * handlers to a FastAPI service backed by Postgres. These fixtures are the
 * evidence that the move preserved the contract: the backend replays every
 * one of them and compares, so "nothing broke" is proven by recorded bytes
 * rather than by asserting counts that the full-archive ingest will change.
 *
 * Run BEFORE any part of the cutover:
 *   npm run record:contract
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { images, collections } from "../lib/catalog";
import { GET as imagesGET } from "../app/api/v1/images/route";
import { GET as imageGET } from "../app/api/v1/images/[id]/route";
import { GET as collectionsGET } from "../app/api/v1/collections/route";
import { GET as collectionGET } from "../app/api/v1/collections/[slug]/route";
import { GET as releasesGET } from "../app/api/v1/collections/[slug]/releases/route";
import { GET as facetsGET } from "../app/api/v1/facets/route";

const OUT = process.argv[2] ?? "../wascat-backend/tests/fixtures/contract";
const ORIGIN = "https://wascat.example.org";

/** The only value that legitimately differs between two identical requests. */
const GENERATED_AT = "<GENERATED_AT>";

type Case = { name: string; path: string; run: (req: Request) => Promise<Response> };

function withParams<P>(
  handler: (req: Request, ctx: { params: Promise<P> }) => Promise<Response>,
  params: P,
) {
  return (req: Request) => handler(req, { params: Promise.resolve(params) });
}

// Representative records are discovered from the data rather than hardcoded,
// so this keeps working when the catalogue is regenerated.
const paired = images.find((image) => image.hasSource && image.hasMask)!;
const maskOnly = images.find((image) => image.hasMask && !image.hasSource)!;
const sourceOnly = images.find((image) => image.hasSource && !image.hasMask)!;
const clearSky = images.find((image) => image.cloudCoverOktas === 0);
const overcast = images.find((image) => image.cloudCoverOktas === 8);

const imageCase = (name: string, query: string): Case => ({
  name: `images-${name}`,
  path: `/api/v1/images${query}`,
  run: imagesGET,
});

const cases: Case[] = [
  // defaults, limits, ordering
  imageCase("default", ""),
  imageCase("limit-1", "?limit=1"),
  imageCase("limit-100", "?limit=100"),
  imageCase("sort-oldest", "?limit=5&sort=oldest"),
  imageCase("sort-newest", "?limit=5&sort=newest"),

  // scoping
  imageCase("video-vid1", "?video=vid1&limit=3"),
  imageCase("video-vid11", "?video=vid11&limit=3"),
  imageCase("collection-vid5", "?collection=vid5&limit=3"),
  imageCase("release-1-0", "?release=1.0&limit=3"),

  // segmentation
  imageCase("segmented-true", "?segmented=true&limit=3"),
  imageCase("segmented-false", "?segmented=false&limit=3"),

  // cloud cover. invariant 7: unsegmented frames must never match these
  imageCase("oktas-0", "?oktas=0&limit=3"),
  imageCase("oktas-4", "?oktas=4&limit=3"),
  imageCase("oktas-8", "?oktas=8&limit=3"),
  imageCase("oktas-min-0", "?oktasMin=0&limit=3"),
  imageCase("oktas-min-5", "?oktasMin=5&limit=3"),
  imageCase("oktas-max-2", "?oktasMax=2&limit=3"),
  imageCase("oktas-range-full", "?oktasMin=0&oktasMax=8&limit=3"),
  imageCase("oktas-range-narrow", "?oktasMin=3&oktasMax=5&limit=3"),

  // artifacts
  imageCase("artifact-source", "?artifact=source&limit=3"),
  imageCase("artifact-mask", "?artifact=mask&limit=3"),

  // free text. substring, not tokenised
  imageCase("q-vid1-substring", "?q=vid1&limit=5"),
  imageCase("q-exact-id", `?q=${paired.id}&limit=3`),
  imageCase("q-overcast-label", "?q=overcast&limit=3"),
  imageCase("q-unsegmented-tag", "?q=unsegmented&limit=3"),
  imageCase("q-source-plus-mask", `?q=${encodeURIComponent("source + mask")}&limit=3`),
  imageCase("q-no-match", "?q=zzzznotpresent&limit=3"),

  // invariant 8: date filters exclude records with no capture timestamp
  imageCase("from-date", "?from=2024-01-01&limit=3"),
  imageCase("to-date", "?to=2030-01-01&limit=3"),

  // vocabularies with no data supplied yet
  imageCase("season-harmattan", "?season=Harmattan&limit=3"),
  imageCase("time-morning", "?time=Morning&limit=3"),
  imageCase("location-kumasi", "?location=Kumasi&limit=3"),

  // cursors. a malformed cursor falls back to the start, it does not 400
  imageCase("cursor-malformed", "?cursor=not-a-real-cursor&limit=2"),
  imageCase("cursor-empty", "?cursor=&limit=2"),

  // rejected queries
  imageCase("err-oktas-9", "?oktas=9"),
  imageCase("err-oktas-negative", "?oktas=-1"),
  imageCase("err-limit-101", "?limit=101"),
  imageCase("err-limit-0", "?limit=0"),
  imageCase("err-video-format", "?video=video1"),
  imageCase("err-season-unknown", "?season=Summer"),
  imageCase("err-segmented-maybe", "?segmented=maybe"),
  imageCase("err-sort-unknown", "?sort=random"),
  imageCase("err-from-not-a-date", "?from=notadate"),
  imageCase("err-multiple", "?oktas=9&limit=101&video=nope"),

  // single records
  {
    name: "image-paired",
    path: `/api/v1/images/${paired.id}`,
    run: withParams(imageGET, { id: paired.id }),
  },
  {
    name: "image-mask-only",
    path: `/api/v1/images/${maskOnly.id}`,
    run: withParams(imageGET, { id: maskOnly.id }),
  },
  {
    name: "image-source-only",
    path: `/api/v1/images/${sourceOnly.id}`,
    run: withParams(imageGET, { id: sourceOnly.id }),
  },
  {
    name: "image-not-found",
    path: "/api/v1/images/WAS-RKV-00000",
    run: withParams(imageGET, { id: "WAS-RKV-00000" }),
  },

  // collections
  { name: "collections-all", path: "/api/v1/collections", run: collectionsGET },
  {
    name: "collection-first",
    path: `/api/v1/collections/${collections[0].slug}`,
    run: withParams(collectionGET, { slug: collections[0].slug }),
  },
  {
    name: "collection-last",
    path: `/api/v1/collections/${collections.at(-1)!.slug}`,
    run: withParams(collectionGET, { slug: collections.at(-1)!.slug }),
  },
  {
    name: "collection-not-found",
    path: "/api/v1/collections/reykjavik-all-sky",
    run: withParams(collectionGET, { slug: "reykjavik-all-sky" }),
  },
  {
    name: "releases-first",
    path: `/api/v1/collections/${collections[0].slug}/releases`,
    run: withParams(releasesGET, { slug: collections[0].slug }),
  },
  {
    name: "releases-not-found",
    path: "/api/v1/collections/nope/releases",
    run: withParams(releasesGET, { slug: "nope" }),
  },

  // facets
  { name: "facets", path: "/api/v1/facets", run: facetsGET },
];

if (clearSky) {
  cases.push({
    name: "image-clear-sky",
    path: `/api/v1/images/${clearSky.id}`,
    run: withParams(imageGET, { id: clearSky.id }),
  });
}
if (overcast) {
  cases.push({
    name: "image-overcast",
    path: `/api/v1/images/${overcast.id}`,
    run: withParams(imageGET, { id: overcast.id }),
  });
}

function normalise(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(normalise);
  if (body && typeof body === "object") {
    return Object.fromEntries(
      Object.entries(body as Record<string, unknown>).map(([key, value]) =>
        key === "generatedAt" && typeof value === "string"
          ? [key, GENERATED_AT]
          : [key, normalise(value)],
      ),
    );
  }
  return body;
}

type IndexEntry = { name: string; path: string; status: number; file: string };

async function record(
  dir: string,
  name: string,
  path: string,
  url: string,
  response: Response,
  body: unknown,
): Promise<IndexEntry> {
  const file = `${name}.json`;
  const payload = {
    name,
    request: { method: "GET", path, url },
    status: response.status,
    headers: {
      "x-ratelimit-limit": response.headers.get("x-ratelimit-limit"),
      "x-ratelimit-remaining": response.headers.get("x-ratelimit-remaining"),
      "content-type": response.headers.get("content-type"),
    },
    body: normalise(body),
  };
  await writeFile(resolve(dir, file), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { name, path, status: response.status, file };
}

async function main() {
  const dir = resolve(OUT);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const index: IndexEntry[] = [];

  for (const testCase of cases) {
    const url = `${ORIGIN}${testCase.path}`;
    const response = await testCase.run(new Request(url));
    index.push(await record(dir, testCase.name, testCase.path, url, response, await response.json()));
  }

  // Walk the real cursor chain so pagination is pinned end to end.
  let nextUrl: string | null = `${ORIGIN}/api/v1/images?limit=2`;
  for (let page = 0; page < 3 && nextUrl; page += 1) {
    const parsed = new URL(nextUrl);
    const response = await imagesGET(new Request(nextUrl));
    const body = (await response.json()) as { links: { next: string | null } };
    index.push(
      await record(
        dir,
        `images-cursor-page-${page}`,
        `${parsed.pathname}${parsed.search}`,
        nextUrl,
        response,
        body,
      ),
    );
    nextUrl = body.links.next;
  }

  await writeFile(
    resolve(dir, "index.json"),
    `${JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        source: "wascat-frontend Next.js route handlers, recorded before the FastAPI migration",
        origin: ORIGIN,
        note: "meta.generatedAt is normalised to <GENERATED_AT>. Every other byte is contract.",
        cases: index,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const ok = index.filter((entry) => entry.status === 200).length;
  const rejected = index.filter((entry) => entry.status === 400).length;
  const missing = index.filter((entry) => entry.status === 404).length;
  const failed = index.filter((entry) => entry.status >= 500);

  console.log(`Recorded ${index.length} contract cases to ${dir}`);
  console.log(`  ${ok} ok - ${rejected} rejected - ${missing} not found`);
  if (failed.length) throw new Error(`${failed.length} cases returned 5xx: ${failed.map((f) => f.name).join(", ")}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
