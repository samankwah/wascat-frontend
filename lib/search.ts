import { z } from "zod";
import { artifactTypes, seasons, timesOfDay, type ImageRecord } from "./catalog";

export const imageQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  collection: z.string().trim().max(80).optional(),
  release: z.string().trim().max(20).optional(),
  /** Capture sequence, e.g. "vid7". */
  video: z.string().trim().regex(/^vid\d+$/).optional(),
  /** Measured cloud cover in oktas, 0–8. Only segmented records can match. */
  oktas: z.coerce.number().int().min(0).max(8).optional(),
  oktasMin: z.coerce.number().int().min(0).max(8).optional(),
  oktasMax: z.coerce.number().int().min(0).max(8).optional(),
  /** Whether the frame carries a cloud mask, and so a measured cloud cover. */
  segmented: z.enum(["true", "false"]).optional(),
  season: z.enum(seasons).optional(),
  time: z.enum(timesOfDay).optional(),
  location: z.string().trim().max(80).optional(),
  artifact: z.enum(artifactTypes).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export type ImageQuery = z.infer<typeof imageQuerySchema>;

export function filterImages(records: ImageRecord[], query: ImageQuery) {
  const term = query.q?.toLowerCase();
  return records
    .filter(
      (record) =>
        (!term ||
          [record.id, record.videoId, String(record.frameIndex), record.location ?? "", ...record.tags]
            .join(" ")
            .toLowerCase()
            .includes(term)) &&
        (!query.collection || record.collection === query.collection) &&
        (!query.release || record.release === query.release) &&
        (!query.video || record.videoId === query.video) &&
        (query.segmented === undefined || record.hasMask === (query.segmented === "true")) &&
        // Cloud-cover filters describe a measurement, so an unsegmented frame
        // cannot satisfy them -- it is excluded rather than treated as 0 oktas.
        (query.oktas === undefined ||
          (record.cloudCoverOktas !== undefined && record.cloudCoverOktas === query.oktas)) &&
        (query.oktasMin === undefined ||
          (record.cloudCoverOktas !== undefined && record.cloudCoverOktas >= query.oktasMin)) &&
        (query.oktasMax === undefined ||
          (record.cloudCoverOktas !== undefined && record.cloudCoverOktas <= query.oktasMax)) &&
        (!query.season || record.season === query.season) &&
        (!query.time || record.timeOfDay === query.time) &&
        (!query.location || (record.location ?? "").toLowerCase().includes(query.location.toLowerCase())) &&
        (!query.artifact || record.artifacts.some((artifact) => artifact.type === query.artifact)) &&
        // Date filters only apply to records that carry a real capture timestamp.
        (!query.from || (record.capturedAt ?? "").slice(0, 10) >= query.from) &&
        (!query.to || (record.capturedAt ?? "").slice(0, 10) <= query.to),
    )
    .sort((a, b) =>
      query.sort === "oldest" ? a.sortKey.localeCompare(b.sortKey) : b.sortKey.localeCompare(a.sortKey),
    );
}

export function encodeCursor(offset: number) { return Buffer.from(JSON.stringify({ offset })).toString("base64url"); }
export function decodeCursor(cursor?: string) {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    return Number.isInteger(parsed.offset) && parsed.offset >= 0 ? parsed.offset : 0;
  } catch { return 0; }
}
