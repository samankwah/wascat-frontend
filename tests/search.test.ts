/**
 * The query contract.
 *
 * Filtering moved to the API, which does it with an index and is tested
 * against a real database. What the frontend still owns is validating its own
 * URL before forwarding it: Explore parses the query string so that a
 * hand-edited or stale link renders the default view instead of surfacing a
 * 400 from the API as an error page.
 *
 * These assertions mirror the backend's parser, which reports the same rules.
 * If the two drift, `npm run types:check` catches the shape and this catches
 * the semantics.
 */
import { describe, expect, it } from "vitest";

import { decodeOffsetCursor, encodeOffsetCursor, imageQuerySchema } from "@/lib/search";
import { oktaValues, seasons, timesOfDay } from "@/lib/vocab";

describe("query defaults", () => {
  it("supplies a page size and an order when none is given", () => {
    const query = imageQuerySchema.parse({});
    expect(query.limit).toBe(24);
    expect(query.sort).toBe("newest");
  });

  it("ignores parameters it does not declare", () => {
    const query = imageQuerySchema.parse({ utm_source: "newsletter" });
    expect(query).not.toHaveProperty("utm_source");
  });

  it("coerces numeric parameters that arrive as strings", () => {
    const query = imageQuerySchema.parse({ oktasMin: "2", limit: "50" });
    expect(query.oktasMin).toBe(2);
    expect(query.limit).toBe(50);
  });
});

describe("accepted vocabularies", () => {
  it("accepts every okta on the scale", () => {
    for (const okta of oktaValues) {
      expect(imageQuerySchema.safeParse({ oktas: okta }).success).toBe(true);
    }
  });

  it("accepts every season and time of day the archive recognises", () => {
    for (const season of seasons) {
      expect(imageQuerySchema.safeParse({ season }).success).toBe(true);
    }
    for (const time of timesOfDay) {
      expect(imageQuerySchema.safeParse({ time }).success).toBe(true);
    }
  });

  it("accepts sequence identifiers and rejects near-misses", () => {
    expect(imageQuerySchema.safeParse({ video: "vid11" }).success).toBe(true);
    expect(imageQuerySchema.safeParse({ video: "video1" }).success).toBe(false);
    expect(imageQuerySchema.safeParse({ video: "VID1" }).success).toBe(false);
  });
});

describe("rejected queries", () => {
  it("bounds the page size", () => {
    expect(imageQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(imageQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("bounds the okta scale", () => {
    expect(imageQuerySchema.safeParse({ oktas: 9 }).success).toBe(false);
    expect(imageQuerySchema.safeParse({ oktas: -1 }).success).toBe(false);
  });

  it("rejects a season the archive does not use", () => {
    // The temperate seasons belong to an earlier version of this catalogue.
    expect(imageQuerySchema.safeParse({ season: "Summer" }).success).toBe(false);
  });

  it("rejects a non-boolean segmentation flag", () => {
    expect(imageQuerySchema.safeParse({ segmented: "maybe" }).success).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(imageQuerySchema.safeParse({ from: "notadate" }).success).toBe(false);
    expect(imageQuerySchema.safeParse({ from: "2026-13-01" }).success).toBe(false);
    expect(imageQuerySchema.safeParse({ from: "2026-03-14" }).success).toBe(true);
  });
});

describe("page cursors", () => {
  it("round trips an offset", () => {
    expect(decodeOffsetCursor(encodeOffsetCursor(42))).toBe(42);
    expect(decodeOffsetCursor(encodeOffsetCursor(0))).toBe(0);
  });

  it("restarts from the beginning rather than failing on a stale cursor", () => {
    // A bookmark from an older page shape should show page one, not an error.
    expect(decodeOffsetCursor("not-a-real-cursor")).toBe(0);
    expect(decodeOffsetCursor(undefined)).toBe(0);
    expect(decodeOffsetCursor("")).toBe(0);
  });

  it("accepts a cursor as a parameter without validating its contents", () => {
    // Cursors are opaque; the API decides what one means.
    expect(imageQuerySchema.safeParse({ cursor: "anything-short-enough" }).success).toBe(true);
    expect(imageQuerySchema.safeParse({ cursor: "x".repeat(201) }).success).toBe(false);
  });
});
