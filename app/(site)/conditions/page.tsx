import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getStationConditions } from "@/lib/conditions";
import { MOMENT, formatDate, sequenceLabel } from "@/lib/format";
import { groundStation, orderedGroundViews, type GroundView } from "@/lib/ground-views";
import { oktaLabel, visibilityLabel, visibilityTerm } from "@/lib/vocab";

export const metadata: Metadata = {
  title: "Current sky conditions",
  description: `Visibility, cloud and ground photographs of the sky at ${groundStation.name}.`,
};

/** Ground photographs shown before the rest fold away behind "Show all". */
const GALLERY_PREVIEW = 8;

const coordinateLabel = ({ latitude, longitude }: { latitude: number; longitude: number }) =>
  `${Math.abs(latitude).toFixed(3)}° ${latitude < 0 ? "S" : "N"}, ${Math.abs(longitude).toFixed(3)}° ${longitude < 0 ? "W" : "E"}`;

const momentLabel = (capturedAt: string | null) => (capturedAt ? `${MOMENT.format(new Date(capturedAt))} UTC` : undefined);

/**
 * The full Sky Conditions record for the ground station, which the home
 * page's card previews.
 *
 * Readings the archive holds are listed; the ones it lacks are named once in
 * a single line beneath them, so a gap is stated without a column of "Not
 * recorded" rows, and a missing report never reads as a clear day.
 */
export default async function ConditionsPage() {
  // Request time, like every catalogue page, so the build needs no database.
  await connection();

  const { view, frame, collection } = await getStationConditions();
  const views = orderedGroundViews();
  const photographed = momentLabel(view?.capturedAt ?? null);
  // The photograph's own report first, then the frame's: both are the station's.
  const visibility = view?.visibilityM ?? frame?.visibilityM ?? undefined;

  const readings: [string, string | undefined][] = [
    ["Cloud type", frame?.skyClass ?? collection?.title],
    ["Visibility", visibility != null ? `${visibilityLabel(visibility)} · ${visibilityTerm(visibility)}` : undefined],
    [
      "Measured cloud cover",
      frame?.cloudCoverOktas != null
        ? `${oktaLabel(frame.cloudCoverOktas)}${frame.cloudFraction != null ? ` · ${(frame.cloudFraction * 100).toFixed(1)}% of the sky` : ""}`
        : undefined,
    ],
    ["Observed cloud cover", frame?.observedCloudCoverOktas != null ? oktaLabel(frame.observedCloudCoverOktas) : undefined],
  ];
  const reported = readings.filter((row): row is [string, string] => Boolean(row[1]));
  const unreported = readings.filter(([, value]) => !value).map(([label]) => label.toLowerCase());

  const station: [string, string][] = [
    ["Station", groundStation.name],
    ["Place", groundStation.place],
    ["Position", coordinateLabel(groundStation.coordinates)],
    ["WMO number", String(groundStation.wmoId)],
  ];

  // The hero is the newest photograph; the gallery is everything else.
  const others = views.filter((entry) => entry.src !== view?.src);
  const preview = others.slice(0, GALLERY_PREVIEW);
  const rest = others.slice(GALLERY_PREVIEW);

  return (
    <>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Sky conditions" }]} />

      <header className="container-shell pt-12 md:pt-16">
        <p className="eyebrow text-sky">Sky conditions</p>
        <h1 className="display mt-4 max-w-3xl text-[clamp(2.4rem,5vw,3.6rem)] leading-tight text-ink">The sky over {groundStation.name}</h1>
        <p className="mt-3 text-muted">
          {groundStation.name} · {groundStation.place}
        </p>
      </header>

      <figure className="container-shell mt-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-abyss sm:aspect-[16/9]">
          {view ? (
            <Image
              src={view.src}
              alt={`The sky over ${groundStation.name}${photographed ? ` at ${photographed}` : ""}, photographed from the ground.`}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover object-[center_30%]"
            />
          ) : null}
        </div>
        <figcaption className="mt-3 text-sm text-muted">
          The station&apos;s newest ground photograph{photographed ? <span className="font-mono text-xs"> · {photographed}</span> : null}
        </figcaption>
      </figure>

      <section className="container-shell grid gap-12 py-16 md:py-20 lg:grid-cols-2 lg:gap-20" aria-label="Observation and station">
        <div>
          <h2 className="eyebrow text-sky">Observation</h2>
          {reported.length > 0 ? (
            <dl className="mt-5 border-t border-line">
              {reported.map(([label, value]) => (
                <Row key={label} label={label} value={value} />
              ))}
            </dl>
          ) : (
            <p className="mt-5 border-t border-line pt-4 text-muted">No readings are attached to this photograph yet.</p>
          )}
          {reported.length > 0 && unreported.length > 0 ? (
            <p className="mt-4 text-sm text-muted">Not yet recorded: {unreported.join(", ")}.</p>
          ) : null}
        </div>

        <div>
          <h2 className="eyebrow text-sky">Station</h2>
          <dl className="mt-5 border-t border-line">
            {station.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </dl>
        </div>
      </section>

      {frame ? (
        <section className="border-t border-line bg-paper py-16 md:py-20" aria-labelledby="all-sky-title">
          <div className="container-shell grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
            <Link href={`/images/${frame.id}`} className="image-zoom relative block aspect-square overflow-hidden rounded-xl bg-ink-abyss" aria-label="Open the all-sky frame record">
              <Image src={frame.image} alt={frame.alt} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
            </Link>
            <div>
              <p className="eyebrow text-sky">All-sky camera</p>
              <h2 id="all-sky-title" className="display mt-3 text-3xl md:text-4xl">The frame behind the cloud readings</h2>
              <p className="mt-4 max-w-md leading-7 text-muted">
                The fisheye camera looks straight up, so it measures cloud cover rather than visibility. Its newest frame from this station supplies the cloud readings above.
              </p>
              <p className="mt-4 font-mono text-xs text-muted">
                Sequence {sequenceLabel(frame.sequenceId)} · frame {frame.frameIndex.toLocaleString()}
                {frame.capturedAt ? ` · ${formatDate(frame.capturedAt, true)}` : ""}
              </p>
              <Link href={`/images/${frame.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-sky">
                Open the frame record <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {preview.length > 0 ? (
        <section className="border-t border-line py-16 md:py-20" aria-labelledby="ground-views-title">
          <div className="container-shell">
            <p className="eyebrow text-sky">Ground views</p>
            <h2 id="ground-views-title" className="display mt-3 text-3xl md:text-4xl">More from the station</h2>
            <GroundViewGrid views={preview} offset={0} total={others.length} />
            {rest.length > 0 ? (
              <details className="group mt-10">
                <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-sky [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">Show all {others.length} photographs</span>
                  <span className="hidden group-open:inline">Show fewer</span>
                </summary>
                <GroundViewGrid views={rest} offset={preview.length} total={others.length} />
              </details>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
      <dt className="text-[.72rem] font-bold uppercase tracking-[.12em] text-muted-dim">{label}</dt>
      <dd className="text-right text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}

/** Thumbnails that open the photograph at full size. A caption appears only when the time is known. */
function GroundViewGrid({ views, offset, total }: { views: GroundView[]; offset: number; total: number }) {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {views.map((entry, index) => {
        const when = momentLabel(entry.capturedAt);
        return (
          <li key={entry.src}>
            <a href={entry.src} target="_blank" rel="noopener noreferrer" className="image-zoom relative block aspect-[4/3] overflow-hidden rounded-lg bg-ink-abyss">
              <Image
                src={entry.src}
                alt={`The sky over ${groundStation.name}${when ? ` at ${when}` : ""} (photo ${offset + index + 1} of ${total}).`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            </a>
            {when ? <p className="mt-2 font-mono text-xs text-muted">{when}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
