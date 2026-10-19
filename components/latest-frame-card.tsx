import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { frameLabel } from "@/lib/format";
import type { Coordinates, ImageRecord } from "@/lib/types";

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const coordinateLabel = ({ latitude, longitude }: Coordinates) =>
  `${Math.abs(latitude).toFixed(4)}° ${latitude < 0 ? "S" : "N"}, ${Math.abs(longitude).toFixed(4)}° ${longitude < 0 ? "W" : "E"}`;

/**
 * One recent frame, for the "latest" row on the home page.
 *
 * The layout is fixed - cloud type over the image, then station and time,
 * place, coordinates, and the date - so a row of cards lines up whatever each
 * record holds. Place and time are shown only when the archive actually has them;
 * until the capture team supplies them the rows say so, rather than being
 * filled with a plausible-looking station or clock time.
 */
export function LatestFrameCard({
  image,
  cloudType,
  station,
  stationCoordinates,
  priority = false,
}: {
  image: ImageRecord;
  cloudType?: string;
  /** The sequence's station, used when the frame has no place of its own. */
  station?: string;
  /** The sequence's station position, used when the frame has none of its own. */
  stationCoordinates?: Coordinates;
  priority?: boolean;
}) {
  const place = image.location ?? station;
  const name = station ?? place;
  const coordinates = image.coordinates ?? stationCoordinates;
  const captured = image.capturedAt ? new Date(image.capturedAt) : undefined;
  const heading = name ? (captured ? `${name} — ${TIME.format(captured)} UTC` : name) : frameLabel(image);

  return (
    <article className="group h-full overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_24px_rgba(16,47,65,.07)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-on-dark hover:shadow-[0_14px_34px_rgba(16,47,65,.13)] focus-within:-translate-y-1 focus-within:shadow-[0_14px_34px_rgba(16,47,65,.13)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={`/images/${image.id}`} className="flex h-full flex-col">
        <div className="image-zoom relative aspect-square bg-ink-abyss">
          <Image src={image.image} alt={image.alt} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" priority={priority} />
          {cloudType ? (
            <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-ink-abyss/80 px-2 py-0.5 text-[.63rem] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[.7rem] font-semibold uppercase tracking-wider text-sky-light ring-1 ring-sky-light/40 backdrop-blur-sm">
              {cloudType}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
          <h3 className="text-sm font-bold leading-snug text-ink sm:text-base">{heading}</h3>
          <p className={`flex items-center gap-1.5 font-mono text-[.73rem] sm:text-xs ${place ? "text-muted" : "text-muted-soft"}`}>
            <MapPin size={13} className="shrink-0 text-rose-600" aria-hidden />
            {place ?? "Station not recorded"}
          </p>
          <p className={`font-mono text-[.66rem] sm:text-[.7rem] ${coordinates ? "text-muted" : "text-muted-soft"}`}>
            {coordinates ? coordinateLabel(coordinates) : "Coordinates not recorded"}
          </p>
          <p className={`flex items-center gap-1.5 font-mono text-[.73rem] sm:text-xs ${captured ? "text-muted" : "text-muted-soft"}`}>
            <Clock size={13} className="shrink-0" aria-hidden />
            {captured ? `${DATE.format(captured)} · ${TIME.format(captured)} UTC` : "Time not recorded"}
          </p>
        </div>
      </Link>
    </article>
  );
}
