/**
 * Builds the WASCAT catalogue from the delivered all-sky imagery.
 *
 *   npm run build:catalog -- --source <corner_mask dir> --masks <cloud_segment dir> [--sample N]
 *
 * The two delivered folders are:
 *   corner_mask    the source all-sky photograph, fisheye circle with the
 *                  corners blacked out (hence "corners masked")
 *   cloud_segment  the binary cloud mask for that same frame, white = cloud
 *
 * They are joined on the `{frameIndex}_vid{N}` key embedded in the filenames.
 * Every number this script writes is measured from the files themselves; any
 * field that would require provenance we do not have is omitted, not invented.
 *
 * `cloud_segment` covers only a fraction of the delivered frames, so a record is
 * one of three kinds: source + mask (measured), mask only (measured, no frame),
 * or source only (a frame nobody has segmented yet, so it carries no cloud-cover
 * measurement at all). The third kind is sampled rather than ingested wholesale:
 * `--sample N` takes N frames per sequence, spread evenly across the sequence so
 * the sample spans the whole capture. `--sample 0` ingests none of them.
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { validateManifest } from "../lib/manifest";
import { oktasFromFraction, type Season, type TimeOfDay } from "../lib/vocab";

const SOURCE_SUFFIX = "_corner_mask.jpg";
const MASK_SUFFIX = "_cloud_segment.jpg";
/** Luma above which a corner-masked pixel counts as inside the camera's circle. */
const INSIDE_CIRCLE_LUMA = 12;
/** Luma above which a mask pixel counts as cloud. Masks are binary; this is the midpoint. */
const CLOUD_LUMA = 128;

type Sequence = {
  frames: number | null;
  geometry: string | null;
  collection: string | null;
  site: string | null;
  latitude: number | null;
  longitude: number | null;
  startedAt: string | null;
  frameIntervalSeconds: number | null;
  instrument: string | null;
};

type Provenance = {
  license: string | null;
  citation: string | null;
  doi: string | null;
  release: string;
  sequences: Record<string, Sequence>;
};

type Artifact = {
  type: "source" | "mask";
  mediaType: string;
  objectKey: string;
  publicUrl: string;
  checksum: string;
  bytes: number;
  width: number;
  height: number;
};

function arg(name: string, fallback?: string) {
  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value && fallback === undefined) throw new Error(`Missing required --${name} <path>`);
  return value ?? fallback!;
}

/** `1498_vid11` -> { videoId: "vid11", frameIndex: 1498 } */
function parseKey(key: string) {
  const match = /^(\d+)_(vid\d+)$/.exec(key);
  if (!match) return undefined;
  return { frameIndex: Number(match[1]), videoId: match[2] };
}

async function keysIn(dir: string, suffix: string) {
  const entries = await readdir(dir);
  const keys = new Map<string, string>();
  for (const entry of entries) {
    if (!entry.endsWith(suffix)) continue;
    keys.set(entry.slice(0, -suffix.length), entry);
  }
  return keys;
}

async function greyscale(path: string) {
  const { data, info } = await sharp(path).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

async function digest(path: string) {
  const buffer = await readFile(path);
  return { checksum: createHash("sha256").update(buffer).digest("hex"), bytes: buffer.byteLength };
}

/** Pixels inside the camera's valid circular field of view, from the corner-masked frame. */
function circleFrom(frame: { data: Buffer; width: number; height: number }) {
  const inside = new Uint8Array(frame.width * frame.height);
  let count = 0;
  for (let i = 0; i < inside.length; i += 1) {
    if (frame.data[i] > INSIDE_CIRCLE_LUMA) {
      inside[i] = 1;
      count += 1;
    }
  }
  return { inside, count };
}

type Circle = { inside: Uint8Array; count: number; cx: number; cy: number; radius: number; width: number; height: number };

/** Geometry of the valid circle: centre and radius, measured from the disc itself. */
function circleGeometry(frame: { data: Buffer; width: number; height: number }): Circle {
  const { inside, count } = circleFrom(frame);
  let minX = frame.width, maxX = -1, minY = frame.height, maxY = -1;
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      if (!inside[y * frame.width + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return {
    inside, count,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    radius: Math.max(maxX - minX, maxY - minY) / 2,
    width: frame.width,
    height: frame.height,
  };
}

/**
 * Largest radius at which the mask marks cloud. When a mask is correctly
 * registered this never exceeds the camera's disc radius; when the mask was
 * produced at a different scale it exceeds it by exactly that scale factor.
 */
function maxCloudRadius(mask: { data: Buffer; width: number; height: number }, circle: Circle) {
  let maxSquared = 0;
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (mask.data[y * mask.width + x] <= CLOUD_LUMA) continue;
      const squared = (x - circle.cx) ** 2 + (y - circle.cy) ** 2;
      if (squared > maxSquared) maxSquared = squared;
    }
  }
  return Math.sqrt(maxSquared);
}

/**
 * Cloud fraction = cloud pixels inside the valid circle / valid circle pixels.
 *
 * `scale` maps a source pixel to its mask pixel: mask = centre + (p - centre) * scale.
 * It is 1 for correctly registered masks, and >1 for masks delivered at a larger
 * scale than the frame they segment.
 */
function cloudFraction(mask: { data: Buffer; width: number; height: number }, circle: Circle, scale: number) {
  if (circle.count === 0) throw new Error("Valid circle is empty; cannot compute cloud fraction");
  let cloud = 0;
  for (let y = 0; y < circle.height; y += 1) {
    for (let x = 0; x < circle.width; x += 1) {
      if (!circle.inside[y * circle.width + x]) continue;
      const mx = Math.round(circle.cx + (x - circle.cx) * scale);
      const my = Math.round(circle.cy + (y - circle.cy) * scale);
      if (mx < 0 || my < 0 || mx >= mask.width || my >= mask.height) continue;
      if (mask.data[my * mask.width + mx] > CLOUD_LUMA) cloud += 1;
    }
  }
  return cloud / circle.count;
}

/**
 * Share of the mask's cloud pixels that fall outside the camera's field of view,
 * viewing the mask through `scale` (1 = as delivered). Zero for a registered mask.
 */
function outsideDiscRatio(mask: { data: Buffer; width: number; height: number }, circle: Circle, scale = 1) {
  let total = 0, outside = 0;
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      // Walk source-frame pixels, sampling the mask through the scale factor.
      const mx = Math.round(circle.cx + (x - circle.cx) * scale);
      const my = Math.round(circle.cy + (y - circle.cy) * scale);
      if (mx < 0 || my < 0 || mx >= mask.width || my >= mask.height) continue;
      if (mask.data[my * mask.width + mx] <= CLOUD_LUMA) continue;
      total += 1;
      if (!circle.inside[y * circle.width + x]) outside += 1;
    }
  }
  return total === 0 ? 0 : outside / total;
}

const SEASON_BY_MONTH: Record<number, Season> = {
  12: "Harmattan", 1: "Harmattan", 2: "Harmattan",
  3: "Transition", 4: "Transition",
  5: "Wet season", 6: "Wet season", 7: "Wet season", 8: "Wet season", 9: "Wet season",
  10: "Transition", 11: "Dry season",
};

function timeOfDayFrom(hour: number): TimeOfDay {
  if (hour < 11) return "Morning";
  if (hour < 14) return "Midday";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

/**
 * N indices spread evenly across `total`, endpoints included. Sampling evenly
 * rather than taking the first N keeps the sample representative of the whole
 * capture instead of only its opening minutes.
 */
function evenIndices(total: number, count: number) {
  if (count >= total) return [...Array(total).keys()];
  if (count <= 1) return count === 1 ? [0] : [];
  const picked = new Set<number>();
  for (let i = 0; i < count; i += 1) picked.add(Math.round((i * (total - 1)) / (count - 1)));
  return [...picked].sort((a, b) => a - b);
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  const sourceDir = resolve(arg("source"));
  const maskDir = resolve(arg("masks"));
  const outFile = resolve(arg("out", "data/catalog.generated.json"));
  const assetRoot = resolve(arg("assets", "public/frames"));
  const sampleSize = Number(arg("sample", "100"));
  if (!Number.isInteger(sampleSize) || sampleSize < 0) throw new Error("--sample must be a non-negative integer");

  const provenance: Provenance = JSON.parse(await readFile(resolve("data/provenance.json"), "utf8"));

  const sources = await keysIn(sourceDir, SOURCE_SUFFIX);
  const masks = await keysIn(maskDir, MASK_SUFFIX);

  const paired = [...masks.keys()].filter((key) => sources.has(key));
  const maskOnly = [...masks.keys()].filter((key) => !sources.has(key));
  const unsegmented = [...sources.keys()].filter((key) => !masks.has(key));

  // The unsegmented frames are sampled, not ingested wholesale: all 16,504 would
  // add ~360 MB of committed assets for records that carry no measurement.
  const unsegmentedByVideo = new Map<string, string[]>();
  for (const key of unsegmented) {
    const parsed = parseKey(key);
    if (!parsed) continue;
    const list = unsegmentedByVideo.get(parsed.videoId) ?? [];
    list.push(key);
    unsegmentedByVideo.set(parsed.videoId, list);
  }
  const sampled: string[] = [];
  for (const [, keys] of [...unsegmentedByVideo].sort(([a], [b]) => Number(a.slice(3)) - Number(b.slice(3)))) {
    keys.sort((a, b) => parseKey(a)!.frameIndex - parseKey(b)!.frameIndex);
    for (const index of evenIndices(keys.length, sampleSize)) sampled.push(keys[index]);
  }

  console.log(`source frames        ${sources.size}`);
  console.log(`segmentation masks   ${masks.size}`);
  console.log(`complete pairs       ${paired.length}`);
  console.log(`mask-only records    ${maskOnly.length}`);
  console.log(`unsegmented frames   ${unsegmented.length}`);
  console.log(`  sampled in         ${sampled.length} (up to ${sampleSize} per sequence, spread evenly)`);
  console.log(`  left out           ${unsegmented.length - sampled.length}`);
  console.log("");

  // One reference circle per video, taken from that video's first available
  // source frame. Used for mask-only records, which have no frame of their own,
  // and as the geometry the masks are checked against.
  const referenceCircle = new Map<string, Circle>();
  const pairedByVideo = new Map<string, string[]>();
  for (const key of paired) {
    const parsed = parseKey(key);
    if (!parsed) continue;
    const list = pairedByVideo.get(parsed.videoId) ?? [];
    list.push(key);
    pairedByVideo.set(parsed.videoId, list);
  }
  for (const [videoId, keys] of pairedByVideo) {
    referenceCircle.set(videoId, circleGeometry(await greyscale(resolve(sourceDir, sources.get(keys[0])!))));
  }

  /**
   * Mask registration per sequence.
   *
   * A correctly produced mask never marks cloud outside the camera's circular
   * field of view. Where it does, the mask was rendered at a different scale
   * than the frame it segments, and the scale factor is recoverable from how far
   * past the disc edge the cloud reaches. Masks are always served exactly as
   * delivered; the factor is recorded so cloud fraction is measured against the
   * true field of view and the overlay can be registered for display.
   */
  const REGISTRATION_TOLERANCE = 0.02;
  const registration = new Map<string, { scale: number; corrected: boolean; outsideBefore: number; outsideAfter: number }>();
  for (const [videoId, keys] of pairedByVideo) {
    const circle = referenceCircle.get(videoId)!;
    const sample = keys.slice(0, 8);
    let worstOutside = 0;
    let maxRadius = 0;
    for (const key of sample) {
      const mask = await greyscale(resolve(maskDir, masks.get(key)!));
      worstOutside = Math.max(worstOutside, outsideDiscRatio(mask, circle));
      maxRadius = Math.max(maxRadius, maxCloudRadius(mask, circle));
    }
    if (worstOutside <= REGISTRATION_TOLERANCE) {
      registration.set(videoId, { scale: 1, corrected: false, outsideBefore: worstOutside, outsideAfter: worstOutside });
      continue;
    }
    const scale = maxRadius / circle.radius;
    // Only accept the correction if it demonstrably registers the mask: the
    // cloud must land inside the field of view once viewed through `scale`.
    let after = 1;
    if (Number.isFinite(scale) && scale > 1 && scale < 2) {
      after = 0;
      for (const key of sample) {
        const mask = await greyscale(resolve(maskDir, masks.get(key)!));
        after = Math.max(after, outsideDiscRatio(mask, circle, scale));
      }
    }
    const accepted = after <= REGISTRATION_TOLERANCE;
    registration.set(videoId, {
      scale: accepted ? scale : 1,
      corrected: accepted,
      outsideBefore: worstOutside,
      outsideAfter: after,
    });
    console.log(
      accepted
        ? `  ${videoId}: masks delivered at ${scale.toFixed(4)}x the frame scale - ${(worstOutside * 100).toFixed(1)}% of cloud fell outside the field of view, ${(after * 100).toFixed(2)}% after registering`
        : `  ${videoId}: ${(worstOutside * 100).toFixed(1)}% of cloud falls outside the field of view and no scale factor fits - left as delivered`,
    );
  }
  if ([...registration.values()].some((entry) => entry.corrected)) console.log("");

  type CatalogRecord = {
    id: string;
    collection: string;
    release: string;
    videoId: string;
    frameIndex: number;
    /** Absent on sampled frames that have no mask: there is nothing to measure. */
    cloudFraction?: number;
    cloudCoverOktas?: number;
    maskScale: number;
    width: number;
    height: number;
    capturedAt?: string;
    location?: string;
    coordinates?: { latitude: number; longitude: number };
    season?: Season;
    timeOfDay?: TimeOfDay;
    instrument?: string;
    provenance: Record<string, unknown>;
    artifacts: Artifact[];
  };

  const records: CatalogRecord[] = [];
  const allKeys = [...masks.keys(), ...sampled]
    .filter((key) => {
      if (parseKey(key)) return true;
      console.warn(`skipping unparseable key: ${key}`);
      return false;
    })
    .sort((a, b) => {
      const pa = parseKey(a)!;
      const pb = parseKey(b)!;
      return pa.videoId === pb.videoId
        ? pa.frameIndex - pb.frameIndex
        : Number(pa.videoId.slice(3)) - Number(pb.videoId.slice(3));
    });

  let done = 0;
  for (const key of allKeys) {
    const { videoId, frameIndex } = parseKey(key)!;
    const sequence = provenance.sequences[videoId];
    if (!sequence) throw new Error(`No provenance entry for ${videoId} in data/provenance.json`);

    const maskName = masks.get(key);
    const maskPath = maskName ? resolve(maskDir, maskName) : undefined;
    const sourceName = sources.get(key);
    const sourcePath = sourceName ? resolve(sourceDir, sourceName) : undefined;

    const frame = sourcePath ? await greyscale(sourcePath) : undefined;
    const mask = maskPath ? await greyscale(maskPath) : undefined;
    // The field of view comes from the frame's own disc where we have the frame,
    // and from the sequence's reference frame for mask-only records.
    const circle = frame ? circleGeometry(frame) : referenceCircle.get(videoId);
    if (!circle) throw new Error(`No reference circle available for ${videoId}`);

    // Registration describes a mask, so a record without one is trivially registered.
    const registered = mask
      ? registration.get(videoId) ?? { scale: 1, corrected: false, outsideBefore: 0, outsideAfter: 0 }
      : { scale: 1, corrected: false, outsideBefore: 0, outsideAfter: 0 };
    // No mask, no measurement. Cloud cover is never estimated from the frame.
    const fraction = mask ? cloudFraction(mask, circle, registered.scale) : undefined;

    const videoNumber = Number(videoId.slice(3));
    const id = `WAS-V${String(videoNumber).padStart(2, "0")}-F${frameIndex}`;
    const dir = resolve(assetRoot, videoId);
    await mkdir(dir, { recursive: true });

    const artifacts: Artifact[] = [];
    if (sourcePath && frame) {
      const target = `${frameIndex}-source.jpg`;
      await copyFile(sourcePath, resolve(dir, target));
      const { checksum, bytes } = await digest(sourcePath);
      artifacts.push({
        type: "source", mediaType: "image/jpeg",
        objectKey: `frames/${videoId}/${target}`, publicUrl: `/frames/${videoId}/${target}`,
        checksum, bytes, width: frame.width, height: frame.height,
      });
    }
    if (maskPath && mask) {
      const target = `${frameIndex}-mask.jpg`;
      await copyFile(maskPath, resolve(dir, target));
      const { checksum, bytes } = await digest(maskPath);
      artifacts.push({
        type: "mask", mediaType: "image/jpeg",
        objectKey: `frames/${videoId}/${target}`, publicUrl: `/frames/${videoId}/${target}`,
        checksum, bytes, width: mask.width, height: mask.height,
      });
    }

    let capturedAt: string | undefined;
    let season: Season | undefined;
    let timeOfDay: TimeOfDay | undefined;
    if (sequence.startedAt && sequence.frameIntervalSeconds) {
      const instant = new Date(Date.parse(sequence.startedAt) + frameIndex * sequence.frameIntervalSeconds * 1000);
      capturedAt = instant.toISOString();
      season = SEASON_BY_MONTH[instant.getUTCMonth() + 1];
      timeOfDay = timeOfDayFrom(instant.getUTCHours());
    }

    records.push({
      id,
      collection: sequence.collection ? slugify(sequence.collection) : videoId,
      release: provenance.release,
      videoId,
      frameIndex,
      ...(fraction === undefined
        ? {}
        : { cloudFraction: Number(fraction.toFixed(6)), cloudCoverOktas: oktasFromFraction(fraction) }),
      width: (frame ?? mask)!.width,
      height: (frame ?? mask)!.height,
      ...(capturedAt ? { capturedAt } : {}),
      ...(sequence.site ? { location: sequence.site } : {}),
      ...(sequence.latitude !== null && sequence.longitude !== null
        ? { coordinates: { latitude: sequence.latitude, longitude: sequence.longitude } }
        : {}),
      ...(season ? { season } : {}),
      ...(timeOfDay ? { timeOfDay } : {}),
      ...(sequence.instrument ? { instrument: sequence.instrument } : {}),
      maskScale: Number(registered.scale.toFixed(6)),
      provenance: {
        pipeline: "cloud-segmentation",
        sourceDelivery: "corner_mask",
        maskDelivery: "cloud_segment",
        validCirclePixels: circle.count,
        validCircleFrom: frame ? "own source frame" : `reference frame for ${videoId}`,
        hasSourceFrame: Boolean(frame),
        segmented: Boolean(mask),
        maskRegistration: registered.corrected
          ? `mask delivered at ${registered.scale.toFixed(4)}x frame scale; registered for measurement and display`
          : "as delivered",
      },
      artifacts,
    });

    done += 1;
    if (done % 200 === 0) console.log(`  processed ${done}/${allKeys.length}`);
  }

  // Validate through the shared ingest contract, one manifest per collection.
  const bySlug = new Map<string, CatalogRecord[]>();
  for (const record of records) {
    const list = bySlug.get(record.collection) ?? [];
    list.push(record);
    bySlug.set(record.collection, list);
  }

  for (const [slug, group] of bySlug) {
    validateManifest({
      schemaVersion: "1.0",
      collection: {
        slug,
        title: slug,
        ...(provenance.license ? { license: provenance.license } : {}),
        ...(provenance.citation ? { citation: provenance.citation } : {}),
        ...(provenance.doi ? { doi: provenance.doi } : {}),
      },
      release: { version: provenance.release },
      images: group,
    });
  }

  const collections = [...bySlug.entries()].map(([slug, group]) => {
    const sequence = Object.entries(provenance.sequences).find(
      ([videoId, value]) => (value.collection ? slugify(value.collection) : videoId) === slug,
    )?.[1];
    const videoIds = [...new Set(group.map((record) => record.videoId))].sort(
      (a, b) => Number(a.slice(3)) - Number(b.slice(3)),
    );
    return {
      slug,
      title: sequence?.site ?? `Sequence ${videoIds.join(", ")}`,
      videoIds,
      images: group.length,
      artifacts: group.reduce((sum, record) => sum + record.artifacts.length, 0),
      withSource: group.filter((record) => record.artifacts.some((a) => a.type === "source")).length,
      segmented: group.filter((record) => record.artifacts.some((a) => a.type === "mask")).length,
      bytes: group.reduce((sum, record) => sum + record.artifacts.reduce((s, a) => s + a.bytes, 0), 0),
      ...(sequence?.site ? { locationName: sequence.site } : {}),
      ...(sequence?.latitude !== null && sequence?.latitude !== undefined && sequence?.longitude !== null && sequence?.longitude !== undefined
        ? { coordinates: { latitude: sequence.latitude, longitude: sequence.longitude } }
        : {}),
      ...(sequence?.instrument ? { instrument: sequence.instrument } : {}),
      ...(provenance.license ? { license: provenance.license } : {}),
      ...(provenance.citation ? { citation: provenance.citation } : {}),
      ...(provenance.doi ? { doi: provenance.doi } : {}),
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    release: provenance.release,
    counts: {
      records: records.length,
      completePairs: paired.length,
      maskOnly: maskOnly.length,
      /** Sampled frames that carry no mask, and so no cloud-cover measurement. */
      sourceOnly: sampled.length,
      unsegmentedFrames: unsegmented.length,
      unsegmentedFramesLeftOut: unsegmented.length - sampled.length,
      sampleSizePerSequence: sampleSize,
      registeredMasks: records.filter((record) => record.maskScale !== 1).length,
    },
    maskRegistration: Object.fromEntries(
      [...registration.entries()].map(([videoId, entry]) => [
        videoId,
        { scale: Number(entry.scale.toFixed(6)), corrected: entry.corrected, cloudOutsideFieldOfView: Number(entry.outsideBefore.toFixed(4)) },
      ]),
    ),
    collections,
    images: records,
  };

  await mkdir(resolve(outFile, ".."), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log("");
  const measured = records.filter((record) => record.cloudFraction !== undefined).length;
  console.log(`wrote ${records.length} records across ${collections.length} collection(s) -> ${outFile}`);
  console.log(`  ${measured} carry a measured cloud cover; ${records.length - measured} are unsegmented frames`);
  console.log(`assets -> ${assetRoot}`);
  const missing = ["license", "citation"].filter((key) => !provenance[key as "license" | "citation"]);
  const unprovenanced = Object.entries(provenance.sequences)
    .filter(([, value]) => !value.site || !value.startedAt || !value.frameIntervalSeconds)
    .map(([videoId]) => videoId);
  if (missing.length) console.log(`note: ${missing.join(", ")} not set in data/provenance.json; omitted from output`);
  if (unprovenanced.length) console.log(`note: no site/timestamps yet for ${unprovenanced.join(", ")}; those fields omitted`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
