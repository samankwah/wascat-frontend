import type { StaticImageData } from "next/image";
import adwoaPortrait from "@/public/images/team/adwoa-gyasi-generated.png";
import oliverPortrait from "@/public/images/team/oliver-kornyo-generated.png";
import princePortrait from "@/public/images/team/prince-asilevi-generated.png";
import richmondPortrait from "@/public/images/team/richmond-owusu-generated.png";
import stephenPortrait from "@/public/images/team/stephen-amankwah-generated.png";

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

export const teamMembers = [
  {
    name: "Dr Prince Junior Asilevi",
    role: "Scientific Lead & Atmospheric Scientist",
    initials: "PJA",
    image: {
      src: princePortrait,
      alt: "Temporary generated editorial portrait representing Dr Prince Junior Asilevi's WASCAT contribution.",
    },
    linkedin: "https://gh.linkedin.com/in/prince-junior-asilevi-ab5966259",
  },
  {
    name: "Mr Stephen Amankwah",
    role: "Software Developer & Agrometeorologist",
    initials: "SA",
    image: {
      src: stephenPortrait,
      alt: "Temporary generated editorial portrait representing Mr Stephen Amankwah's WASCAT contribution.",
    },
  },
  {
    name: "Richmond Owusu",
    role: "Data Engineer & Web Platform Developer",
    initials: "RO",
    image: {
      src: richmondPortrait,
      alt: "Temporary generated editorial portrait representing Richmond Owusu's WASCAT contribution.",
    },
  },
  {
    name: "Adwoa Gyasi",
    role: "Climate Data Analyst & Curator",
    initials: "AG",
    image: {
      src: adwoaPortrait,
      alt: "Temporary generated editorial portrait representing Adwoa Gyasi's WASCAT contribution.",
    },
  },
  {
    name: "Oliver Kornyo",
    role: "Research Computing & Machine Learning",
    initials: "OK",
    image: {
      src: oliverPortrait,
      alt: "Temporary generated editorial portrait representing Oliver Kornyo's WASCAT contribution.",
    },
    linkedin: "https://gh.linkedin.com/in/oliver-kornyo-phd-lecturer-comp-sci-knust-28644879",
  },
] satisfies readonly TeamMember[];
