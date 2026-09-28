import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, Globe2, Linkedin, ShieldCheck, Zap } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PartnerCarousel } from "@/components/partner-carousel";
import { partners } from "@/lib/partners";
import { teamMembers, type TeamMember } from "@/lib/team";

export const metadata: Metadata = {
  title: "About",
  description:
    "West African Sky Cloud Atlas & Dataset: documenting and analysing cloud formations across Ghana with all-sky imagery and AI.",
};

const pillars = [
  {
    icon: ShieldCheck,
    title: "Scientific Rigor",
    body: "Every image is stored with its capture metadata and a checksum, and our collection follows standard meteorological practice.",
  },
  {
    icon: Zap,
    title: "AI-Powered Analysis",
    body: "Deep learning models classify each image and separate cloud from sky, so every observation comes with measured cloud cover.",
  },
  {
    icon: Globe2,
    title: "Regional Coverage",
    body: "Our sites stretch from the coast to the northern savannah, capturing the range of conditions across West Africa's climate zones.",
  },
  {
    icon: BookOpen,
    title: "Open Research",
    body: "The dataset, models, and findings are openly available so researchers can use, cite, and build on them.",
  },
] as const;

const models = [
  { name: "EfficientNet-B0", body: "High-accuracy image classification with an efficient use of parameters." },
  { name: "MobileNet", body: "A lightweight model built for fast predictions on edge devices." },
  { name: "Custom Cloud Classifier", body: "A purpose-built model trained on the WASCAT dataset." },
] as const;

const disciplines = ["Atmospheric Science", "Computer Vision", "Machine Learning", "Meteorology", "Climate Research"];

function TeamCard({ member, className }: { member: TeamMember; className: string }) {
  // The role reads "Title, Department, Institution": the first clause is the
  // contribution label, the rest is the affiliation.
  const [title, ...affiliation] = member.role.split(", ");
  return (
    <li className={`group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-[0_2px_8px_rgba(27,73,103,.06)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-sky-light hover:shadow-[0_14px_34px_rgba(16,47,65,.13)] focus-within:-translate-y-1 focus-within:border-sky-light focus-within:shadow-[0_14px_34px_rgba(16,47,65,.13)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0 lg:col-span-2 ${className}`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-line-soft">
        {member.image ? (
          <Image
            src={member.image.src}
            alt={member.image.alt}
            fill
            sizes="(max-width: 767px) calc(100vw - 28px), (max-width: 1023px) calc(50vw - 30px), 390px"
            className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <span aria-hidden="true" className="display flex size-full items-center justify-center bg-sky-pale text-6xl text-sky-dark transition-colors duration-200 group-hover:bg-sky-mist">
            {member.initials}
          </span>
        )}
      </div>
      <div className="flex flex-1 items-start justify-between gap-4 border-t border-line p-5">
        <div>
          <h3 className="text-lg font-bold leading-snug text-ink">{member.name}</h3>
          <p className="mt-1 text-sm font-semibold text-sky">{title}</p>
          {affiliation.length > 0 ? <p className="mt-1 text-sm leading-6 text-muted">{affiliation.join(", ")}</p> : null}
        </div>
        {member.linkedin ? (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} on LinkedIn (opens in a new tab)`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-sky transition-colors hover:border-[#0a66c2] hover:bg-[#0a66c2] hover:text-white"
          >
            <Linkedin size={16} strokeWidth={1.8} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </li>
  );
}

// Cards span 2 of 6 columns, so 3 fit per row; a partial last row is centred.
function centringClass(index: number, total: number) {
  const remainder = total % 3;
  const lastRowStart = total - remainder;
  if (remainder === 1 && index === lastRowStart) return "lg:col-start-3";
  if (remainder === 2 && index === lastRowStart) return "lg:col-start-2";
  if (remainder === 2 && index === lastRowStart + 1) return "lg:col-start-4";
  return "";
}

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <section className="border-b border-line bg-sky-wash">
        <div className="container-shell py-16 md:py-20">
          <p className="eyebrow text-sky">About the project</p>
          <h1 className="display mt-4 text-5xl leading-tight md:text-6xl">About WASCAT</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
            The West African Sky Cloud Atlas &amp; Dataset is a research project that documents and analyses cloud formations across Ghana using all-sky imagery and AI.
          </p>
        </div>
      </section>

      <section className="container-shell py-16 md:py-20" aria-labelledby="mission-title">
        <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr] md:gap-12">
          <h2 id="mission-title" className="display text-3xl md:text-4xl">Our Mission</h2>
          <div className="space-y-5 leading-7 text-muted">
            <p>
              WASCAT collects all-sky cloud images from observation sites across Ghana and pairs each one with AI classification and segmentation. The result is an open, well-documented cloud dataset for West Africa, built for meteorologists, climate researchers, educators, and anyone curious about the sky.
            </p>
          </div>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2">
          {pillars.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-5 rounded-lg border border-line p-6">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-pale text-sky">
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-paper py-16 md:py-20" aria-labelledby="models-title">
        <div className="container-shell grid gap-8 md:grid-cols-[.7fr_1.3fr] md:gap-12">
          <div>
            <h2 id="models-title" className="display text-3xl md:text-4xl">AI Models</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              WASCAT uses several models for cloud classification and segmentation. Each one contributes to the predictions shown on every image.
            </p>
          </div>
          <ol className="divide-y divide-line border-y border-line">
            {models.map(({ name, body }, index) => (
              <li key={name} className="grid grid-cols-[48px_1fr] gap-3 py-5 sm:grid-cols-[48px_220px_1fr]">
                <span className="font-mono text-xs leading-7 text-sky">0{index + 1}</span>
                <h3 className="font-bold text-ink">{name}</h3>
                <p className="col-start-2 text-sm leading-6 text-muted sm:col-start-auto">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-shell py-16 md:py-20" aria-labelledby="team-title">
        <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr] md:gap-12">
          <h2 id="team-title" className="display text-3xl md:text-4xl">Research Team</h2>
          <div>
            <p className="leading-7 text-muted">
              WASCAT is developed by a multidisciplinary team of atmospheric scientists, computer vision researchers, and software engineers from KNUST and the Ghana Meteorological Agency.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Disciplines">
              {disciplines.map((discipline) => (
                <li key={discipline} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-panel">
                  {discipline}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-6" aria-label="WASCAT team members">
          {teamMembers.map((member, index) => (
            <TeamCard key={member.name} member={member} className={centringClass(index, teamMembers.length)} />
          ))}
        </ul>
      </section>

      <section id="partners" className="border-t border-line bg-sky-pale py-16 md:py-20" aria-labelledby="partners-title">
        <div className="container-shell">
          <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr] md:gap-12">
            <h2 id="partners-title" className="display text-3xl md:text-4xl">Partners</h2>
            <p className="leading-7 text-muted">
              WASCAT is supported by KNUST&apos;s research administration and Ghana&apos;s national weather service. Each logo is shown to credit that institution&apos;s support.
            </p>
          </div>
          <div className="mt-12">
            <PartnerCarousel partners={partners} />
          </div>
        </div>
      </section>
    </>
  );
}
