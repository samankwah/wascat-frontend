import { describe, expect, it } from "vitest";
import { teamMembers } from "../lib/team";

describe("WASCAT team data", () => {
  it("keeps all seven contribution labels and initials in display order", () => {
    expect(teamMembers.map(({ name, role, initials }) => ({ name, role, initials }))).toEqual([
      {
        name: "Dr Prince Junior Asilevi",
        role: "Project Lead, Department of Meteorology and Climate Science, KNUST, Kumasi",
        initials: "PJA",
      },
      {
        name: "Prof. Emmanuel Quansah",
        role: "Co-Lead, Department of Meteorology and Climate Science, KNUST, Kumasi",
        initials: "EQ",
      },
      {
        name: "Dr Oliver Kornyo",
        role: "Co-Lead, Department of Computer Science, KNUST, Kumasi",
        initials: "OK",
      },
      { name: "Sandra Adjetey", role: "Meteorologist, Ghana Meteorological Agency", initials: "SA" },
      {
        name: "Richmond Owusu Agyei",
        role: "Graduate Researcher and IT Technician, Department of Computer Science, KNUST, Kumasi",
        initials: "ROA",
      },
      {
        name: "Edem Junior Appiah-Yeboah",
        role: "Graduate Researcher, Department of Meteorology and Climate Science, KNUST, Kumasi",
        initials: "EJA",
      },
      {
        name: "Stephen Amankwah",
        role: "Principal Meteorologist Technician, Ghana Meteorological Agency",
        initials: "SA",
      },
    ]);
  });

  it("only exposes the three verified direct LinkedIn profiles", () => {
    expect(teamMembers.filter(({ linkedin }) => linkedin).map(({ name }) => name)).toEqual([
      "Dr Prince Junior Asilevi",
      "Dr Oliver Kornyo",
      "Stephen Amankwah",
    ]);
    // Both gh.linkedin.com (the Ghana-localised subdomain) and the plain
    // www.linkedin.com host are genuine LinkedIn profile URLs.
    expect(
      teamMembers.every(
        ({ linkedin }) =>
          !linkedin ||
          linkedin.startsWith("https://gh.linkedin.com/in/") ||
          linkedin.startsWith("https://www.linkedin.com/in/"),
      ),
    ).toBe(true);
  });
});
