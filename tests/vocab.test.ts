import { describe, expect, it } from "vitest";

import { visibilityLabel, visibilityTerm } from "@/lib/vocab";

describe("visibility", () => {
  it("reads METAR's 9999 as ten kilometres or more, not 9.999 km", () => {
    expect(visibilityLabel(9999)).toBe("10 km or more");
    expect(visibilityTerm(9999)).toBe("Good");
  });

  it("keeps short visibilities in metres", () => {
    expect(visibilityLabel(800)).toBe("800 m");
    expect(visibilityTerm(800)).toBe("Very poor");
  });

  it("shows longer visibilities in kilometres", () => {
    expect(visibilityLabel(3500)).toBe("3.5 km");
    expect(visibilityLabel(25000)).toBe("25 km");
  });

  it("follows the Met Office band boundaries", () => {
    expect(visibilityTerm(999)).toBe("Very poor");
    expect(visibilityTerm(1000)).toBe("Poor");
    expect(visibilityTerm(4000)).toBe("Moderate");
    expect(visibilityTerm(40000)).toBe("Very good");
  });
});
