import { describe, expect, it } from "vitest";
import { pageItems } from "@/lib/pagination";

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps the ends and the current page's neighbours, with gaps between", () => {
    expect(pageItems(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
    expect(pageItems(1, 12)).toEqual([1, 2, "gap", 12]);
    expect(pageItems(12, 12)).toEqual([1, "gap", 11, 12]);
  });

  it("fills a single missing page rather than marking a gap of one", () => {
    expect(pageItems(4, 12)).toEqual([1, 2, 3, 4, 5, "gap", 12]);
  });
});
