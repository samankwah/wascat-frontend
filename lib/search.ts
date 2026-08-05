import { z } from "zod";
import { artifactTypes, seasons, skyClasses, timesOfDay, type ImageRecord } from "./catalog";

export const imageQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  collection: z.string().trim().max(80).optional(),
  release: z.string().trim().max(20).optional(),
  class: z.enum(skyClasses).optional(),
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
  return records.filter((record) =>
    (!term || [record.id, record.capturedAt, record.location, record.skyClass, ...record.tags].join(" ").toLowerCase().includes(term)) &&
    (!query.collection || record.collection === query.collection) &&
    (!query.release || record.release === query.release) &&
    (!query.class || record.skyClass === query.class) &&
    (!query.season || record.season === query.season) &&
    (!query.time || record.timeOfDay === query.time) &&
    (!query.location || record.location.toLowerCase().includes(query.location.toLowerCase())) &&
    (!query.artifact || record.artifacts.some((artifact) => artifact.type === query.artifact)) &&
    (!query.from || record.capturedAt.slice(0, 10) >= query.from) &&
    (!query.to || record.capturedAt.slice(0, 10) <= query.to),
  ).sort((a, b) => query.sort === "oldest" ? a.capturedAt.localeCompare(b.capturedAt) : b.capturedAt.localeCompare(a.capturedAt));
}

export function encodeCursor(offset: number) { return Buffer.from(JSON.stringify({ offset })).toString("base64url"); }
export function decodeCursor(cursor?: string) {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    return Number.isInteger(parsed.offset) && parsed.offset >= 0 ? parsed.offset : 0;
  } catch { return 0; }
}
