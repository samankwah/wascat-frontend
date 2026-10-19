import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MOMENT } from "@/lib/format";
import { groundStation } from "@/lib/ground-views";
import type { StationConditions } from "@/lib/conditions";
import { oktaLabel, visibilityLabel } from "@/lib/vocab";

/**
 * The home page's preview of /conditions: the station's newest ground
 * photograph and whatever is known about the sky in it.
 *
 * It shows only what the archive holds; the full record is one click away.
 * The whole card is a single link: the title carries it and stretches over
 * the card, so there is one tab stop and one accessible name.
 */
export function SkyConditionsCard({ conditions }: { conditions: StationConditions }) {
  const { view, frame, collection } = conditions;
  const photographed = view?.capturedAt ? `${MOMENT.format(new Date(view.capturedAt))} UTC` : undefined;
  // The photograph's own report first, then the frame's: both are the station's.
  const visibility = view?.visibilityM ?? frame?.visibilityM ?? undefined;
  const cloudType = frame?.skyClass ?? collection?.title;

  const observations = (
    [
      ["Cloud type", cloudType],
      ["Visibility", visibility != null ? visibilityLabel(visibility) : undefined],
      ["Cloud cover", frame?.cloudCoverOktas != null ? oktaLabel(frame.cloudCoverOktas) : undefined],
    ] as [string, string | undefined][]
  ).filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <article className="group relative grid overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_24px_rgba(16,47,65,.07)] transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-[0_14px_34px_rgba(16,47,65,.12)] has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-focus motion-reduce:transition-none lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-abyss sm:aspect-[16/9] lg:aspect-auto lg:min-h-[420px]">
        {view ? (
          <Image
            src={view.src}
            alt={`The sky over ${groundStation.name}${photographed ? ` at ${photographed}` : ""}, photographed from the ground.`}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover object-[center_30%] transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : null}
      </div>

      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <p className="eyebrow text-sky">Sky conditions</p>
        <h2 id="current-conditions-title" className="display mt-4 text-3xl leading-tight text-ink md:text-4xl">
          <Link href="/conditions" className="outline-none after:absolute after:inset-0 after:content-['']">
            The sky over {groundStation.name}
          </Link>
        </h2>
        <p className="mt-3 text-muted">
          {groundStation.name} · {groundStation.place}
        </p>
        {photographed ? <p className="mt-1.5 font-mono text-xs text-muted">{photographed}</p> : null}

        {observations.length > 0 ? (
          <dl className="mt-8 border-t border-line lg:mt-auto">
            {observations.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
                <dt className="text-[.72rem] font-bold uppercase tracking-[.12em] text-muted-dim">{label}</dt>
                <dd className="text-right text-base font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <span
          aria-hidden
          className={`${observations.length > 0 ? "mt-6" : "mt-8 lg:mt-auto"} inline-flex items-center gap-2 self-start text-sm font-bold text-sky`}
        >
          View details
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1 group-has-[a:focus-visible]:translate-x-1 motion-reduce:transition-none" />
        </span>
      </div>
    </article>
  );
}
