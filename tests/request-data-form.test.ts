import { describe, expect, it } from "vitest";
import { checkRequest } from "@/components/request-data-form";

const valid = {
  name: "Ama Mensah",
  email: "ama@university.example.org",
  organisation: "University of Ghana",
  purpose: "Training a cloud segmentation model for my thesis.",
  collections: ["seq-003"],
  acceptLicence: true,
  website: "",
};

describe("checkRequest", () => {
  it("accepts a complete request", () => {
    expect(checkRequest(valid)).toEqual({});
  });

  it("names every missing or short field, as the API would", () => {
    const errors = checkRequest({ ...valid, name: " ", email: "ama@", organisation: "", purpose: "data pls", collections: [], acceptLicence: false });
    expect(Object.keys(errors).sort()).toEqual(["acceptLicence", "collections", "email", "name", "organisation", "purpose"]);
  });

  it("counts the purpose after trimming, so padding cannot pass", () => {
    expect(checkRequest({ ...valid, purpose: `   short purpose${" ".repeat(20)}` }).purpose).toBeDefined();
  });

  it("does not police the hidden field: that is the API's job", () => {
    expect(checkRequest({ ...valid, website: "https://spam.example" })).toEqual({});
  });
});
