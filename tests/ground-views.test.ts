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

describe("addressing", () => {
  it("gives every photograph a distinct id that finds it again", async () => {
    const { findGroundView, groundViewId } = await import("@/lib/ground-views");
    const ids = groundViews.map(groundViewId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const view of groundViews) expect(findGroundView(groundViewId(view))).toBe(view);
    expect(findGroundView("no-such-photo")).toBeUndefined();
  });

  it("relates photographs by their main cloud only, never to themselves", async () => {
    const { relatedGroundViews } = await import("@/lib/ground-views");
    for (const view of groundViews) {
      const related = relatedGroundViews(view, groundViews);
      expect(related).not.toContain(view);
      for (const other of related) expect(other.clouds[0]).toBe(view.clouds[0]);
    }
  });
});

describe("cloud type groups", () => {
  it("groups by main cloud in the archive's order, each opening on its first photograph", async () => {
    const { cloudTypeGroups, orderedGroundViews } = await import("@/lib/ground-views");
    const views = orderedGroundViews();
    const groups = cloudTypeGroups(views);
    const order = groups.map((group) => cloudTypeNames.indexOf(group.name));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(groups.reduce((sum, group) => sum + group.count, 0)).toBe(views.length);
    for (const group of groups) expect(group.first).toBe(views.find((view) => view.clouds[0] === group.name));
  });
});
