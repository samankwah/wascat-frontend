import type { StaticImageData } from "next/image";
import edemPortrait from "@/public/images/team/edem-appiah-yeboah.jpg";
import emmanuelPortrait from "@/public/images/team/emmanuel-quansah.jpg";
import oliverPortrait from "@/public/images/team/oliver-kornyo-generated.png";
import princePortrait from "@/public/images/team/prince-asilevi-generated.png";
import richmondPortrait from "@/public/images/team/richmond-owusu-agyei.jpg";
import sandraPortrait from "@/public/images/team/sandra-adjetey.jpg";
import stephenPortrait from "@/public/images/team/stephen-amankwah.jpg";

export type TeamMember = {
  name: string;
  role: string;
  initials: string;
  image?: {
    src: string | StaticImageData;
    alt: string;
  };
  linkedin?: string;
};

// The WASCAT team, Department of Meteorology and Climate Science / Department
// of Computer Science, KNUST, Kumasi, and the Ghana Meteorological Agency.
export const teamMembers = [
  {
    name: "Dr Prince Junior Asilevi",
    role: "Project Lead, Department of Meteorology and Climate Science, KNUST, Kumasi",
    initials: "PJA",
    image: {
      src: princePortrait,
      alt: "Temporary generated editorial portrait representing Dr Prince Junior Asilevi's WASCAT contribution.",
    },
    linkedin: "https://gh.linkedin.com/in/prince-junior-asilevi-ab5966259",
  },
  {
    name: "Prof. Emmanuel Quansah",
    role: "Co-Lead, Department of Meteorology and Climate Science, KNUST, Kumasi",
    initials: "EQ",
    image: {
      src: emmanuelPortrait,
      alt: "Portrait of Prof. Emmanuel Quansah.",
    },
  },
  {
    name: "Dr Oliver Kornyo",
    role: "Co-Lead, Department of Computer Science, KNUST, Kumasi",
    initials: "OK",
    image: {
      src: oliverPortrait,
      alt: "Temporary generated editorial portrait representing Dr Oliver Kornyo's WASCAT contribution.",
    },
    linkedin: "https://gh.linkedin.com/in/oliver-kornyo-phd-lecturer-comp-sci-knust-28644879",
  },
  {
    name: "Sandra Adjetey",
    role: "Meteorologist, Ghana Meteorological Agency",
    initials: "SA",
    image: {
      src: sandraPortrait,
      alt: "Portrait of Sandra Adjetey.",
    },
  },
  {
    name: "Richmond Owusu Agyei",
    role: "Graduate Researcher and IT Technician, Department of Computer Science, KNUST, Kumasi",
    initials: "ROA",
    image: {
      src: richmondPortrait,
      alt: "Portrait of Richmond Owusu Agyei.",
    },
  },
  {
    name: "Edem Junior Appiah-Yeboah",
    role: "Graduate Researcher, Department of Meteorology and Climate Science, KNUST, Kumasi",
    initials: "EJA",
    image: {
      src: edemPortrait,
      alt: "Portrait of Edem Junior Appiah-Yeboah.",
    },
  },
  {
    name: "Stephen Amankwah",
    role: "Principal Meteorologist Technician, Ghana Meteorological Agency",
    initials: "SA",
    image: {
      src: stephenPortrait,
      alt: "Portrait of Stephen Amankwah.",
    },
    linkedin: "https://www.linkedin.com/in/stephenamankwah/",
  },
] satisfies readonly TeamMember[];
