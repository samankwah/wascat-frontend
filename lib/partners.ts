import type { StaticImageData } from "next/image";
import gmetLogo from "@/public/images/partners/gmet.png";
import krefLogo from "@/public/images/partners/knust-kref.png";
import ogrLogo from "@/public/images/partners/ogr-knust.png";

export type Partner = {
  name: string;
  shortName: string;
  description: string;
  logo: { src: StaticImageData; alt: string };
  url: string;
};

// Institutions supporting WASCAT. Logos are each partner's own official mark,
// used here only to credit them - not to claim their endorsement of any
// specific finding in this demonstration archive.
export const partners = [
  {
    name: "Office of Grants and Research, KNUST",
    shortName: "OGR",
    description: "KNUST's central office for research and grant administration support.",
    logo: { src: ogrLogo, alt: "Office of Grants and Research, KNUST logo" },
    url: "https://ogr.knust.edu.gh/",
  },
  {
    name: "KNUST Research Fund",
    shortName: "KReF",
    description: "Funds problem-solving, interdisciplinary research at KNUST.",
    logo: { src: krefLogo, alt: "Kwame Nkrumah University of Science and Technology logo" },
    url: "https://funding.knust.edu.gh/index.php/kref/intro",
  },
  {
    name: "Ghana Meteorological Agency",
    shortName: "GMet",
    description: "Ghana's national weather and climate service.",
    logo: { src: gmetLogo, alt: "Ghana Meteorological Agency logo" },
    url: "https://www.meteo.gov.gh/",
  },
] satisfies readonly Partner[];
