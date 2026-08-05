import { describe, expect, it } from "vitest";
import { teamMembers } from "../lib/team";

describe("WASCAT team data", () => {
  it("keeps all five contribution labels and initials in display order", () => {
    expect(teamMembers.map(({ name, role, initials }) => ({ name, role, initials }))).toEqual([
      { name: "Dr Prince Junior Asilevi", role: "Scientific Lead & Atmospheric Scientist", initials: "PJA" },
      { name: "Mr Stephen Amankwah", role: "Software Developer & Agrometeorologist", initials: "SA" },
      { name: "Richmond Owusu", role: "Data Engineer & Web Platform Developer", initials: "RO" },
      { name: "Adwoa Gyasi", role: "Climate Data Analyst & Curator", initials: "AG" },
      { name: "Oliver Kornyo", role: "Research Computing & Machine Learning", initials: "OK" },
    ]);
  });

  it("only exposes the two verified direct LinkedIn profiles", () => {
    expect(teamMembers.filter(({ linkedin }) => linkedin).map(({ name }) => name)).toEqual([
      "Dr Prince Junior Asilevi",
      "Oliver Kornyo",
    ]);
    expect(teamMembers.every(({ linkedin }) => !linkedin || linkedin.startsWith("https://gh.linkedin.com/in/"))).toBe(true);
  });
});
