import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GroundViewCarousel } from "@/components/ground-view-carousel";
import { getStationConditions, stationReadings } from "@/lib/conditions";
import { formatDate, sequenceLabel } from "@/lib/format";
import { groundStation } from "@/lib/ground-views";

export const metadata: Metadata = {
  title: "Current sky conditions",
  description: `Visibility, cloud and ground photographs of the sky at ${groundStation.name}.`,
};

const coordinateLabel = ({ latitude, longitude }: { latitude: number; longitude: number }) =>
  `${Math.abs(latitude).toFixed(3)}° ${latitude < 0 ? "S" : "N"}, ${Math.abs(longitude).toFixed(3)}° ${longitude < 0 ? "W" : "E"}`;

/**
 * The full Sky Conditions record for the ground station, which the home
 * page's card previews.
 *
 * Every photograph is in the carousel, so there is no separate hero and
 * gallery to keep in step. Where the station is goes in one line under the
 * title rather than a table of its own. Readings the archive holds are
 * listed; the ones it lacks are named once beneath them, so a gap is stated
 * without a column of "Not recorded" rows, and a missing report never reads
 * as a clear day.
 */
export default async function ConditionsPage({ searchParams }: { searchParams: Promise<{ photo?: string }> }) {
  // Request time, like every catalogue page, so the build needs no database.
  await connection();

  const [conditions, { photo }] = await Promise.all([getStationConditions(), searchParams]);
  const { views, frame } = conditions;
  const { readings, missing } = stationReadings(conditions);

  return (
    <>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Sky conditions" }]} />

      <header className="container-shell pt-12 md:pt-16">
        <p className="eyebrow text-sky">Sky conditions</p>
        <h1 className="display mt-4 max-w-3xl text-[clamp(2.4rem,5vw,3.6rem)] leading-tight text-ink">The sky over {groundStation.name}</h1>
        <p className="mt-3 text-muted">
          {groundStation.place}
          <span className="font-mono text-sm">
            {" "}· {coordinateLabel(groundStation.coordinates)} · WMO {groundStation.wmoId}
          </span>
        </p>
      </header>

      <div className="container-shell mt-10">
        <GroundViewCarousel views={views} place={groundStation.name} variant="page" eager initialPhoto={photo ? Number(photo) : undefined} />
      </div>

      <section
        className={`container-shell grid gap-12 py-16 md:py-20 ${frame ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20" : ""}`}
        aria-label="Observation"
      >
        <div>
          <h2 className="eyebrow text-sky">Observation</h2>
          {readings.length > 0 ? (
            <dl className="mt-5 border-t border-line">
              {readings.map(({ label, detail }) => (
                <div key={label} className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
                  <dt className="shrink-0 text-sm text-muted">{label}</dt>
                  <dd className="text-right text-sm font-bold text-ink">{detail}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-5 border-t border-line pt-4 text-muted">No readings are attached to these photographs yet.</p>
          )}
          {readings.length > 0 && missing.length > 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted">Not yet recorded: {missing.join(", ")}.</p>
          ) : null}
        </div>

        {frame ? (
          <div>
            <h2 className="eyebrow text-sky">All-sky camera</h2>
            <div className="mt-5 grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-5 border-t border-line pt-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <Link href={`/images/${frame.id}`} className="image-zoom relative block aspect-square overflow-hidden rounded-lg bg-ink-abyss" tabIndex={-1} aria-hidden="true">
                <Image src={frame.image} alt="" fill sizes="144px" className="object-cover" />
              </Link>
              <div>
                <p className="leading-7 text-muted">
                  The fisheye camera looks straight up, so it measures cloud rather than visibility. Its newest frame from this station supplies the cloud cover readings.
                </p>
                {frame.skyClass ? (
                  <p className="mt-3 text-sm text-muted">
                    Classified as <span className="font-bold text-ink">{frame.skyClass}</span>
                  </p>
                ) : null}
                <p className="mt-3 font-mono text-xs text-muted">
                  Sequence {sequenceLabel(frame.sequenceId)} · frame {frame.frameIndex.toLocaleString()}
                  {frame.capturedAt ? ` · ${formatDate(frame.capturedAt, true)}` : ""}
                </p>
                <Link href={`/images/${frame.id}`} className="group mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky">
                  Open the frame record
                  <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
