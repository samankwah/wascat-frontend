import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Linkedin, Mail, ShieldCheck } from "lucide-react";
import { teamMembers, type TeamMember } from "@/lib/team";

export const metadata: Metadata = { title: "About", description: "About the scope and responsible use of the WASCAT v1.0 West African demonstration archive." };

function TeamPortrait({ member }: { member: TeamMember }) {
  return (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden border-b border-line bg-line-soft">
      {member.image ? (
        <Image
          src={member.image.src}
          alt={member.image.alt}
          fill
          sizes="(max-width: 767px) calc(100vw - 28px), (max-width: 1023px) calc(50vw - 30px), 390px"
          className="object-cover object-top"
        />
      ) : (
        <span aria-hidden="true" className="display flex size-full items-center justify-center bg-[radial-gradient(circle_at_68%_24%,rgba(255,255,255,.7),transparent_28%),linear-gradient(145deg,#e7f3f8,#c6e0eb)] text-[clamp(3rem,5vw,4.5rem)] text-sky-dark">
          {member.initials}
        </span>
      )}
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <section className="container-shell grid gap-10 py-16 md:grid-cols-[.7fr_1.3fr] md:py-24"><p className="eyebrow text-sky">ABOUT WASCAT v1.0</p><div><h1 className="display max-w-4xl text-5xl leading-tight md:text-7xl">A transparent demonstration archive for West African sky research.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-muted">WASCAT makes expert-labelled atmospheric imagery easier to find, understand, cite, and reuse through examples represented across Ghana, Nigeria, and Burkina Faso.</p><p className="mt-5 max-w-2xl border-l-2 border-sky pl-5 text-sm leading-6 text-muted"><strong className="text-ink">Demonstration scope:</strong> the catalog records, station profiles, release details, measurements, and citations are fixtures for evaluating the archive experience. They do not describe operational observing stations or published datasets.</p></div></section>
      <section className="border-y border-line bg-sky-pale py-16"><div className="container-shell grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 md:gap-8">{[[BookOpen, "Open by default", "Demonstration images, artifacts, and metadata are directly inspectable without an account."], [ShieldCheck, "Stable by design", "Numbered fixture releases illustrate how citations, checksums, and download links remain recoverable."], [Mail, "Expert labelled", "The catalog models a curator-reviewed label vocabulary for regional cloud, haze, dust, and seasonal conditions."]].map(([Icon, title, body], index) => { const Graphic = Icon as typeof BookOpen; return <div key={String(title)} className={index === 2 ? "col-span-2 md:col-span-1" : ""}><Graphic size={23} className="text-sky" /><h2 className="display mt-5 text-2xl">{String(title)}</h2><p className="mt-3 text-sm leading-6 text-muted">{String(body)}</p></div>; })}</div></section>
      <section className="bg-paper py-16 md:py-24" aria-labelledby="team-title">
        <div className="container-shell">
          <div className="grid gap-5 md:grid-cols-[.7fr_1.3fr] md:gap-10">
            <p className="eyebrow text-sky">MEET THE TEAM</p>
            <div>
              <h2 id="team-title" className="display text-4xl leading-tight md:text-5xl">The people shaping WASCAT.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">These contribution labels describe each member&apos;s work on WASCAT and are not formal employer titles. The generated portrait illustrations are temporary visual placeholders, not depictions of the named team members, and will be replaced with approved photographs.</p>
            </div>
          </div>

          <ul className="mt-11 grid gap-5 md:grid-cols-2 lg:grid-cols-6" aria-label="WASCAT team members">
            {teamMembers.map((member, index) => (
              <li
                key={member.name}
                className={`group flex min-h-[390px] flex-col overflow-hidden border border-line bg-white shadow-[0_8px_24px_rgba(16,47,65,.05)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-on-dark hover:shadow-[0_14px_34px_rgba(16,47,65,.11)] lg:col-span-2 ${index === 3 ? "lg:col-start-2" : ""} ${index === 4 ? "lg:col-start-4" : ""}`}
              >
                <TeamPortrait member={member} />
                <div className="flex flex-1 items-end justify-between gap-4 p-6">
                  <div>
                    <h3 className="display text-[1.55rem] leading-tight text-ink">{member.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{member.role}</p>
                  </div>
                  {member.linkedin ? (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on LinkedIn (opens in a new tab)`}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-field text-sky transition-colors hover:border-[#0a66c2] hover:bg-[#0a66c2] hover:text-white focus-visible:border-[#0a66c2] focus-visible:bg-[#0a66c2] focus-visible:text-white"
                    >
                      <Linkedin size={18} strokeWidth={1.8} aria-hidden="true" />
                    </a>
                  ) : (
                    <span
                      role="link"
                      aria-label={`${member.name} LinkedIn profile coming soon`}
                      aria-disabled="true"
                      title="LinkedIn profile coming soon"
                      className="inline-flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-on-dark text-on-dark-dim"
                    >
                      <Linkedin size={18} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section id="using-the-data" className="container-shell grid gap-12 py-16 md:grid-cols-[.75fr_1.25fr] md:py-24"><div><p className="eyebrow text-sky">USING THE DATA</p><h2 className="display mt-3 text-4xl">License and cite with care.</h2></div><div className="space-y-9"><div><h3 className="font-bold">Check the collection license</h3><p className="mt-3 text-sm leading-6 text-muted">The collection page, release fixture, and metadata response identify the governing license. Attribution requirements apply to derived work as well as redistributed files.</p></div><div><h3 className="font-bold">Cite an explicit release</h3><p className="mt-3 text-sm leading-6 text-muted">Use the prepared demonstration citation and include the version number. A publication link appears only when a verified DOI is available; this fixture does not invent one.</p></div><div><h3 className="font-bold">Do not infer beyond the metadata</h3><p className="mt-3 text-sm leading-6 text-muted">These records demonstrate an archive structure, not observed climatology. A segmentation mask represents a modelled pipeline decision, not error-free physical truth.</p></div></div></section>
      <section className="bg-ink-panel py-16 text-white"><div className="container-shell flex flex-col justify-between gap-7 md:flex-row md:items-center"><div><p className="eyebrow text-sky-light">QUESTIONS OR CORRECTIONS?</p><h2 className="display mt-3 text-4xl">Talk to the archive maintainers.</h2><p className="mt-3 text-sm text-on-dark">Include a stable image identifier or collection release in your message.</p></div><a href="mailto:data@wascat.org" className="button-light">data@wascat.org <ArrowRight size={16} /></a></div></section>
      <section className="container-shell py-14 text-center"><p className="text-sm text-muted">WASCAT v1.0 is an open research-infrastructure demonstration focused on West Africa. <Link href="/methods" className="font-bold text-sky">Read the methodology →</Link></p></section>
    </>
  );
}
