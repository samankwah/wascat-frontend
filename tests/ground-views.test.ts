import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { cloudTypeNames } from "@/lib/cloud-types";
import { groundViews } from "@/lib/ground-views";

describe("ground views", () => {
  it("points every entry at a photo that exists", () => {
    for (const view of groundViews) {
      expect(existsSync(join(process.cwd(), "public", view.src))).toBe(true);
    }
  });

  it("names at least one cloud genus for every photo, from the archive's list", () => {
    for (const view of groundViews) {
      expect(view.clouds.length).toBeGreaterThan(0);
      for (const cloud of view.clouds) expect(cloudTypeNames).toContain(cloud);
    }
  });

  it("shows each photograph once", () => {
    expect(new Set(groundViews.map((view) => view.src)).size).toBe(groundViews.length);
    const digests = groundViews.map((view) =>
      createHash("sha256").update(readFileSync(join(process.cwd(), "public", view.src))).digest("hex"),
    );
    expect(new Set(digests).size).toBe(groundViews.length);
  });

  it("carries only times and visibilities that parse", () => {
    for (const view of groundViews) {
      if (view.capturedAt) expect(Number.isNaN(Date.parse(view.capturedAt))).toBe(false);
      if (view.visibilityM != null) expect(view.visibilityM).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("ordering", () => {
  it("puts dated photos first, newest first, and keeps delivery order for the rest", async () => {
    const { orderedGroundViews } = await import("@/lib/ground-views");
    const base = { width: 1, height: 1, clouds: ["Cumulus"], visibilityM: null };
    const views = [
      { ...base, src: "a", capturedAt: null },
      { ...base, src: "b", capturedAt: "2026-09-09T08:00:00Z" },
      { ...base, src: "c", capturedAt: null },
      { ...base, src: "d", capturedAt: "2026-09-09T15:00:00Z" },
    ];
    expect(orderedGroundViews(views).map((view) => view.src)).toEqual(["d", "b", "a", "c"]);
  });
});
