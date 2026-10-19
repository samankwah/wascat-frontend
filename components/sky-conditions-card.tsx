import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GroundViewCarousel } from "@/components/ground-view-carousel";
import { stationReadings, type StationConditions } from "@/lib/conditions";
import { groundStation } from "@/lib/ground-views";

/**
 * The home page's way in to /conditions: what the sky over the station looks
 * like, what it has reported, and one link to the rest.
 *
 * Not a whole-card link, unlike the archive's cards: the photographs swipe,
 * and a link under them would turn every drag into a page change. The title
 * and the button go to /conditions; each photograph goes there opened on
 * itself.
 */
export function SkyConditionsCard({ conditions }: { conditions: StationConditions }) {
  const { readings } = stationReadings(conditions);

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-8 overflow-hidden rounded-xl border border-line bg-white p-5 sm:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-14 lg:p-10">
      <div className="flex flex-col">
        <p className="eyebrow text-sky">Sky conditions</p>
        <h2 id="current-conditions-title" className="display mt-4 text-3xl leading-tight text-ink md:text-4xl">
          <Link href="/conditions" className="hover:text-sky">
            The sky over {groundStation.name}
          </Link>
        </h2>
        <p className="mt-3 leading-7 text-muted">
          {groundStation.place}. Photographed from the ground at the synoptic station.
        </p>

        {readings.length > 0 ? (
          <dl className="mt-8 border-t border-line">
            {readings.map(({ label, value }) => (
              <div key={label} className="flex items-baseline justify-between gap-6 border-b border-line py-3">
                <dt className="shrink-0 text-sm text-muted">{label}</dt>
                <dd className="text-right text-sm font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <Link
          href="/conditions"
          className="group mt-8 inline-flex items-center gap-2 self-start rounded-lg px-4 py-2.5 text-sm font-bold text-sky ring-1 ring-line-strong transition-colors hover:bg-sky-pale motion-reduce:transition-none"
        >
          View conditions
          <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      </div>

      <GroundViewCarousel views={conditions.views} place={groundStation.name} variant="card" linkTo="/conditions" />
    </article>
  );
}
