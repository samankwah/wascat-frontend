import { describe, expect, it } from "vitest";
import { nearestSlide } from "@/lib/carousel";

// Four 300px slides with a 12px gap; the track can scroll 600px.
const offsets = [0, 312, 624, 936];

describe("nearestSlide", () => {
  it("starts on the first slide", () => {
    expect(nearestSlide(0, offsets, 600)).toBe(0);
  });

  it("picks the slide whose edge is nearest", () => {
    expect(nearestSlide(150, offsets, 600)).toBe(0);
    expect(nearestSlide(170, offsets, 600)).toBe(1);
    expect(nearestSlide(312, offsets, 600)).toBe(1);
  });

  it("treats the end of the track as the last slide", () => {
    expect(nearestSlide(600, offsets, 600)).toBe(3);
    expect(nearestSlide(599.5, offsets, 600)).toBe(3);
  });

  it("copes with a track that cannot scroll and with no slides", () => {
    expect(nearestSlide(0, [0], 0)).toBe(0);
    expect(nearestSlide(0, [], 0)).toBe(0);
  });
});
