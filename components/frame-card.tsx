import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Clock, Cloud, MapPin } from "lucide-react";
import { frameLabel } from "@/lib/format";
import type { CollectionSummary, Coordinates, ImageRecord } from "@/lib/types";

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const coordinateLabel = ({ latitude, longitude }: Coordinates) =>
  `${Math.abs(latitude).toFixed(4)}° ${latitude < 0 ? "S" : "N"}, ${Math.abs(longitude).toFixed(4)}° ${longitude < 0 ? "W" : "E"}`;

/**
 * One catalogue record in a grid: status and measured cover over the image,
 * then the sequence's cloud type, which frame this is, the station,
 * coordinates, capture date, and the model's cloud-type reading.
 *
 * The heading names the cloud and the pin line names the station - never the
 * other way round, and never one of them twice. Coordinates have a line of
 * their own, so the pin line uses the bare station name rather than the
 * collection's "station · lat, lon" label. Anything missing is said to be
 * missing rather than filled in. "Processed" means a mask exists; cover is
 * measured from it, so a frame without one shows no cover chip.
 */
export function FrameCard({
  image,
  site,
  priority = false,
}: {
  image: ImageRecord;
  /** The frame's capture sequence, for its cloud type, station and coordinates. */
  site?: Pick<CollectionSummary, "title" | "locationName" | "coordinates">;
  priority?: boolean;
}) {
  const station = site?.locationName ?? undefined;
  const coordinates = image.coordinates ?? site?.coordinates ?? undefined;
  const captured = image.capturedAt ? new Date(image.capturedAt) : undefined;
  // An unnamed sequence's public title falls back to its station; repeating
  // that as the heading would print the station twice.
  const cloud = site?.title && site.title !== station ? site.title : undefined;
  const heading = cloud ?? frameLabel(image);
  const cover = image.cloudFraction != null ? Math.round(image.cloudFraction * 100) : undefined;
  const prediction = image.predictions?.[0];
  const top = prediction?.classes[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_8px_rgba(27,73,103,.06)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-light hover:shadow-[0_12px_28px_rgba(16,47,65,.12)] focus-within:border-sky-light focus-within:shadow-[0_12px_28px_rgba(16,47,65,.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={`/images/${image.id}`} className="flex flex-1 flex-col">
        <div className="image-zoom relative aspect-square bg-line-soft">
          <Image
            src={image.image}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 40vw, 28vw"
            className="object-cover"
            priority={priority}
          />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-ink-abyss/80 px-2 py-0.5 text-[.6rem] font-semibold uppercase tracking-wider text-white ring-1 ring-white/20 backdrop-blur-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[.65rem]">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${image.hasMask ? "bg-lime" : "bg-sky-light"}`} />
            {image.hasMask ? "Processed" : "Pending"}
          </span>
          {cover != null && (
            <span
              className="tabular absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-ink-abyss/80 px-2 py-0.5 font-mono text-[.65rem] font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm sm:bottom-3 sm:right-3 sm:text-[.7rem]"
              title="Cloud cover measured from the segmentation mask"
            >
              {cover}% <Cloud size={12} aria-label="cloud cover" />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
          <h2 className="text-sm font-bold leading-snug text-ink sm:text-[.95rem]">{heading}</h2>
          {cloud ? (
            <p className="-mt-1 font-mono text-[.62rem] uppercase tracking-wider text-muted-dim sm:text-[.66rem]">
              {frameLabel(image)}
            </p>
          ) : null}
          <p className={`flex items-center gap-1.5 font-mono text-[.7rem] sm:text-xs ${station ? "text-muted" : "text-muted-soft"}`}>
            <MapPin size={13} className="shrink-0 text-rose-600" aria-hidden />
            {station ?? "Station not recorded"}
          </p>
          <p className={`font-mono text-[.66rem] sm:text-[.7rem] ${coordinates ? "text-muted" : "text-muted-soft"}`}>
            {coordinates ? coordinateLabel(coordinates) : "Coordinates not recorded"}
          </p>
          <p className={`flex items-center gap-1.5 font-mono text-[.7rem] sm:text-xs ${captured ? "text-muted" : "text-muted-soft"}`}>
            <Clock size={13} className="shrink-0" aria-hidden />
            {captured ? `${DATE.format(captured)} · ${TIME.format(captured)} UTC` : "Time not recorded"}
          </p>
        </div>
      </Link>

      {/* Outside the link: a disclosure inside an anchor is invalid markup and
          would navigate on every toggle. */}
      {top && prediction && (
        <details open className="group/prediction mx-3 border-t border-line py-2.5 sm:mx-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[.72rem] font-semibold text-sky hover:text-sky-dark sm:text-xs [&::-webkit-details-marker]:hidden">
            AI Cloud-Type Prediction
            <ChevronDown size={14} aria-hidden className="shrink-0 transition-transform group-open/prediction:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="mt-2.5">
            <p className="font-mono text-[.6rem] uppercase tracking-[.16em] text-muted-dim">AI cloud classification</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[.58rem] uppercase tracking-[.14em] text-muted-dim">Primary prediction</p>
                <p className="truncate text-base font-bold leading-tight text-sky sm:text-lg">{top.skyClass}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[.58rem] uppercase tracking-[.14em] text-muted-dim">Confidence</p>
                <p className="tabular text-base font-bold leading-tight text-sky sm:text-lg">{Math.round(top.probability * 100)}%</p>
              </div>
            </div>
            <ol className="mt-3 grid gap-2">
              {prediction.classes.slice(0, 5).map((entry, index) => {
                const percent = entry.probability * 100;
                return (
                  <li key={entry.skyClass} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                    <span className={`truncate text-[.72rem] sm:text-xs ${index === 0 ? "font-semibold text-ink" : "text-muted"}`}>{entry.skyClass}</span>
                    <span className="tabular font-mono text-[.7rem] text-muted">{Math.round(percent)}%</span>
                    <span className="col-span-2 block h-1.5 rounded-full bg-line-soft" aria-hidden>
                      <span className="block h-full rounded-full bg-gradient-to-r from-sky-light to-sky" style={{ width: `${Math.max(percent, 1)}%` }} />
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 font-mono text-[.6rem] text-muted-soft">
              {prediction.model.name} · {prediction.model.version}
            </p>
          </div>
        </details>
      )}
    </article>
  );
}
