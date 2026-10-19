import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GroundViewPhoto } from "@/components/ground-view-photo";
import { GroundViewThumbnails } from "@/components/ground-view-thumbnails";
import { cloudTypeInfo } from "@/lib/cloud-types";
import { MOMENT } from "@/lib/format";
import { cloudTypeGroups, groundStation, groundViewId, orderedGroundViews, relatedGroundViews, type GroundView } from "@/lib/ground-views";

/** How many other photographs to offer when none share this one's cloud type: two full rows at full width. */
const OTHERS_SHOWN = 10;

/**
 * The other skies, one of each combination of clouds in turn before any repeats,
 * so a short list shows the range rather than the most common type ten times.
 */
function variedSkies(views: readonly GroundView[], exclude: GroundView): GroundView[] {
  const byType = new Map<string, GroundView[]>();
  for (const view of views) {
    if (view.src === exclude.src) continue;
    // By the whole combination, so "Cumulus" and "Cumulus · Altostratus" count as different skies.
    const key = view.clouds.join(" · ");
    byType.set(key, [...(byType.get(key) ?? []), view]);
  }
  const queues = [...byType.values()];
  const picked: GroundView[] = [];
  while (picked.length < OTHERS_SHOWN && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next && picked.length < OTHERS_SHOWN) picked.push(next);
    }
  }
  return picked;
}

const coordinateLabel = ({ latitude, longitude }: { latitude: number; longitude: number }) =>
  `${Math.abs(latitude).toFixed(3)}° ${latitude < 0 ? "S" : "N"}, ${Math.abs(longitude).toFixed(3)}° ${longitude < 0 ? "W" : "E"}`;

const href = (view: GroundView) => `/conditions/${groundViewId(view)}`;

/**
 * One ground photograph's page: the photograph, what its sky is, and the
 * other photographs of the same kind of sky.
 *
 * The cloud type leads because it is what someone arriving from the home
 * page's carousel chose. The reference notes are the archive's own, the same
 * ones the collection cards use. The thumbnails beneath are the photographs
 * whose main cloud is the same genus; when there are none, other skies from
 * the station instead, so the page never ends in an empty section.
 */
export function GroundViewPage({ view }: { view: GroundView }) {
  const views = orderedGroundViews();
  const [main, ...others] = view.clouds;
  // Previous and next move between cloud types, not photographs: the thumbnails below already step through this one.
  const groups = cloudTypeGroups(views);
  const group = groups.findIndex((entry) => entry.name === main);
  const previous = groups[group - 1];
  const next = groups[group + 1];
  const info = cloudTypeInfo(main);
  const when = view.capturedAt ? `${MOMENT.format(new Date(view.capturedAt))} UTC` : undefined;

  const related = relatedGroundViews(view, views);
  const thumbnails = related.length > 0 ? related : variedSkies(views, view);

  const placeFacts = [
    ["Location", groundStation.place],
    ["Position", coordinateLabel(groundStation.coordinates)],
  ] as const;
  const facts: (readonly [string, string])[] = [
    ["Station", groundStation.name],
    ...placeFacts,
    ["WMO number", String(groundStation.wmoId)],
    ...(when ? ([["Taken", when]] as const) : []),
  ];

  return (
    <>
      <Breadcrumbs everywhere trail={[{ label: "Home", href: "/" }, { label: "Sky conditions", href: "/conditions" }, { label: main }]} />

      <section className="container-shell grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-start lg:gap-16">
        <GroundViewPhoto view={view} group={[view, ...related]} place={groundStation.name} placeFacts={placeFacts} />

        <div className="flex flex-col lg:min-h-full lg:py-2">
          <p className="eyebrow text-sky">Sky conditions · {groundStation.name}</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,5vw,3.4rem)] leading-[1.05] text-ink">{main}</h1>
          {info ? (
            <>
              <p className="mt-3 font-mono text-sm text-muted">
                {info.level === "Vertical" ? "Vertical development" : `${info.level} cloud`} · {info.heights}
              </p>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{info.description}</p>
              <p className="mt-4 text-ink">
                <span className="text-muted">Usually brings </span>
                {info.weather.charAt(0).toLowerCase() + info.weather.slice(1)}.
              </p>
            </>
          ) : null}
          {others.length > 0 ? (
            <p className="mt-5 self-start rounded-lg bg-paper px-3.5 py-2 text-sm text-ink">
              <span className="text-muted">Also in the frame: </span>
              {others.join(", ")}
            </p>
          ) : null}

          <dl className="mt-8 max-w-xl border-t border-line text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 border-b border-line py-3">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className={`text-right text-ink ${label === "Position" || label === "WMO number" ? "font-mono text-xs" : "font-semibold"}`}>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">Cloud types are identified from the photograph.</p>

          <nav aria-label="Cloud types" className="mt-10 grid max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-line pt-5 lg:mt-auto">
            {previous ? (
              <Link href={href(previous.first)} className="group flex min-w-0 flex-col items-start justify-self-start">
                <span className="text-xs text-muted">Previous type</span>
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-bold text-sky">
                  <ArrowLeft size={15} aria-hidden="true" className="shrink-0 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                  {previous.name}
                </span>
              </Link>
            ) : (
              <span />
            )}
            <p className="tabular text-center font-mono text-xs text-muted">
              <span className="text-ink">{group + 1}</span> of {groups.length} cloud types
            </p>
            {next ? (
              <Link href={href(next.first)} className="group flex min-w-0 flex-col items-end justify-self-end text-right">
                <span className="text-xs text-muted">Next type</span>
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-bold text-sky">
                  {next.name}
                  <ArrowRight size={15} aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </section>

      {thumbnails.length > 0 ? (
        <section className="border-t border-line bg-paper py-14 md:py-20" aria-labelledby="related-title">
          <div className="container-shell">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 id="related-title" className="display text-3xl leading-tight text-ink md:text-4xl">
                {related.length > 0 ? `More ${main}` : `Other skies over ${groundStation.name}`}
              </h2>
              <p className="text-sm text-muted">
                {related.length > 0
                  ? `${related.length} more ${related.length === 1 ? "photograph" : "photographs"} from ${groundStation.name}`
                  : `No other ${main} photographed yet`}
              </p>
            </div>

            <GroundViewThumbnails
              key={view.src}
              label={related.length > 0 ? `More ${main}` : "Other skies"}
              items={thumbnails.map((entry) => ({
                href: href(entry),
                src: entry.src,
                alt: `${entry.clouds.join(" and ")} over ${groundStation.name}.`,
                // Under "More Stratocumulus" every thumbnail is Stratocumulus; say only what else is in it.
                ...(related.length > 0
                  ? entry.clouds.length > 1
                    ? { caption: `with ${entry.clouds.slice(1).join(", ")}` }
                    : {}
                  : { caption: entry.clouds.join(" · "), captionLeads: true }),
              }))}
            />
          </div>
        </section>
      ) : null}
    </>
  );
}
