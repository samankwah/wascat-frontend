/**
 * The public query contract.
 *
 * Filtering itself moved to the API, which can use an index. What stays here
 * is validation: Explore parses its own URL before forwarding it, so a
 * hand-edited query string produces the default view rather than a 400 from
 * the API rendered as an error page.
 *
 * The schema must stay in step with the backend query parser, which reports
 * these same rules with these same messages.
 */
import { z } from "zod";
import { artifactTypes, seasons, timesOfDay } from "./vocab";

export const imageQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  collection: z.string().trim().max(80).optional(),
  release: z.string().trim().max(20).optional(),
  /** Capture sequence, e.g. "seq-007", or dated once one carries a timestamp. */
  sequence: z
    .string()
    .trim()
    .regex(/^seq-(?:\d{8}-)?\d{3}$/)
    .optional(),
  /** Measured cloud cover in oktas, 0–8. Only segmented records can match. */
  oktas: z.coerce.number().int().min(0).max(8).optional(),
  oktasMin: z.coerce.number().int().min(0).max(8).optional(),
  oktasMax: z.coerce.number().int().min(0).max(8).optional(),
  /** Whether the frame carries a cloud mask, and so a measured cloud cover. */
  segmented: z.enum(["true", "false"]).optional(),
  season: z.enum(seasons).optional(),
  time: z.enum(timesOfDay).optional(),
  location: z.string().trim().max(80).optional(),
  /** A curator's read of the sequence's dominant sky condition, not a closed enum. */
  skyClass: z.string().trim().max(80).optional(),
  artifact: z.enum(artifactTypes).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export type ImageQuery = z.infer<typeof imageQuerySchema>;

/**
 * Opaque page cursors.
 *
 * The API issues keyset cursors, which are cheap and stable but only move
 * forward. Explore offers Previous as well as Next, so it pages by offset -
 * a form the API still accepts, and the right one for a UI that is browsed
 * rather than streamed. The encoding is identical either way, so a cursor
 * from either side round-trips.
 */
export function encodeOffsetCursor(offset: number) {
  return Buffer.from(JSON.stringify({ offset })).toString("base64url");
}

export function decodeOffsetCursor(cursor?: string) {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    return Number.isInteger(parsed.offset) && parsed.offset >= 0 ? parsed.offset : 0;
  } catch {
    return 0;
  }
}
