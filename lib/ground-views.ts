/**
 * Ground-level photographs of the sky from Kumasi Airport, for the Current sky
 * conditions section on the home page.
 *
 * These are not all-sky camera frames: they have no mask, no measured cloud
 * cover and no place in a release, so they live here rather than in the
 * archive. They were shared over WhatsApp, which strips the camera's own
 * metadata, so the capture time and the visibility the station reported
 * cannot be read from the files. Fill them in from the station's records:
 *
 *   capturedAt   ISO 8601 in UTC, e.g. "2026-09-09T14:00:00Z"
 *   visibilityM  the reported visibility in metres, as METAR/SYNOP carry it
 *                (9999 means 10 km or more)
 *
 * Until a value is supplied the page says it is not recorded; nothing is
 * guessed. The comment on each line is the file's original name, to match
 * your notes against.
 */
import type { Coordinates } from "./types";

export type GroundView = {
  src: string;
  width: number;
  height: number;
  capturedAt: string | null;
  visibilityM: number | null;
};

/**
 * Kumasi's synoptic station, at the airport. Same position and WMO number as
 * seed/provenance.json in the backend; `archiveStation` is the name the
 * archive's collections carry for it, which is how its all-sky frames are
 * found.
 */
export const groundStation: {
  name: string;
  place: string;
  wmoId: number;
  archiveStation: string;
  coordinates: Coordinates;
} = {
  name: "Kumasi Airport",
  place: "Kumasi, Ghana",
  wmoId: 65442,
  archiveStation: "Kumasi Synoptic Station",
  coordinates: { latitude: 6.715, longitude: -1.591 },
};

export const groundViews: readonly GroundView[] = [
  { src: "/images/ground/kumasi-airport/ground-01.jpg", width: 1200, height: 1600, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.00 PM.jpeg
  { src: "/images/ground/kumasi-airport/ground-02.jpg", width: 1200, height: 1600, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.00 PM (1).jpeg
  { src: "/images/ground/kumasi-airport/ground-03.jpg", width: 1200, height: 1600, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.00 PM (2).jpeg
  { src: "/images/ground/kumasi-airport/ground-04.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.00 PM (3).jpeg
  { src: "/images/ground/kumasi-airport/ground-05.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.00 PM (4).jpeg
  { src: "/images/ground/kumasi-airport/ground-06.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.00 PM (5).jpeg
  { src: "/images/ground/kumasi-airport/ground-07.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.00 PM (6).jpeg
  { src: "/images/ground/kumasi-airport/ground-08.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.00 PM (7).jpeg
  { src: "/images/ground/kumasi-airport/ground-09.jpg", width: 608, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM.jpeg
  { src: "/images/ground/kumasi-airport/ground-10.jpg", width: 608, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (1).jpeg
  { src: "/images/ground/kumasi-airport/ground-11.jpg", width: 608, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (2).jpeg
  { src: "/images/ground/kumasi-airport/ground-12.jpg", width: 608, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (3).jpeg
  { src: "/images/ground/kumasi-airport/ground-13.jpg", width: 720, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (4).jpeg
  { src: "/images/ground/kumasi-airport/ground-14.jpg", width: 720, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (5).jpeg
  { src: "/images/ground/kumasi-airport/ground-15.jpg", width: 720, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (6).jpeg
  { src: "/images/ground/kumasi-airport/ground-16.jpg", width: 720, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (7).jpeg
  { src: "/images/ground/kumasi-airport/ground-17.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (8).jpeg
  { src: "/images/ground/kumasi-airport/ground-18.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (9).jpeg
  { src: "/images/ground/kumasi-airport/ground-19.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (10).jpeg
  { src: "/images/ground/kumasi-airport/ground-20.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (11).jpeg
  { src: "/images/ground/kumasi-airport/ground-21.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (12).jpeg
  { src: "/images/ground/kumasi-airport/ground-22.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (13).jpeg
  { src: "/images/ground/kumasi-airport/ground-23.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (14).jpeg
  { src: "/images/ground/kumasi-airport/ground-24.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (15).jpeg
  { src: "/images/ground/kumasi-airport/ground-25.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (16).jpeg
  { src: "/images/ground/kumasi-airport/ground-26.jpg", width: 720, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (17).jpeg
  { src: "/images/ground/kumasi-airport/ground-27.jpg", width: 720, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (18).jpeg
  { src: "/images/ground/kumasi-airport/ground-28.jpg", width: 720, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (19).jpeg
  { src: "/images/ground/kumasi-airport/ground-29.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (20).jpeg
  { src: "/images/ground/kumasi-airport/ground-30.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (21).jpeg
  { src: "/images/ground/kumasi-airport/ground-31.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (22).jpeg
  { src: "/images/ground/kumasi-airport/ground-32.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (23).jpeg
  { src: "/images/ground/kumasi-airport/ground-33.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (24).jpeg
  { src: "/images/ground/kumasi-airport/ground-34.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (25).jpeg
  { src: "/images/ground/kumasi-airport/ground-35.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (26).jpeg
  { src: "/images/ground/kumasi-airport/ground-36.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (27).jpeg
  { src: "/images/ground/kumasi-airport/ground-37.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (28).jpeg
  { src: "/images/ground/kumasi-airport/ground-38.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (29).jpeg
  { src: "/images/ground/kumasi-airport/ground-39.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (30).jpeg
  { src: "/images/ground/kumasi-airport/ground-40.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (31).jpeg
  { src: "/images/ground/kumasi-airport/ground-41.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (32).jpeg
  { src: "/images/ground/kumasi-airport/ground-42.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (33).jpeg
  { src: "/images/ground/kumasi-airport/ground-43.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (34).jpeg
  { src: "/images/ground/kumasi-airport/ground-44.jpg", width: 960, height: 1280, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (35).jpeg
  { src: "/images/ground/kumasi-airport/ground-45.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (36).jpeg
  { src: "/images/ground/kumasi-airport/ground-46.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.01 PM (37).jpeg
  { src: "/images/ground/kumasi-airport/ground-47.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.02 PM.jpeg
  { src: "/images/ground/kumasi-airport/ground-48.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.02 PM (1).jpeg
  { src: "/images/ground/kumasi-airport/ground-49.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.02 PM (2).jpeg
  { src: "/images/ground/kumasi-airport/ground-50.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.02 PM (3).jpeg
  { src: "/images/ground/kumasi-airport/ground-51.jpg", width: 810, height: 1080, capturedAt: null, visibilityM: null }, // WhatsApp Image 2026-09-09 at 4.37.02 PM (4).jpeg
];

/**
 * Newest first once times are known. Photos without a time keep the order
 * they were delivered in, after every dated one.
 */
export function orderedGroundViews(views: readonly GroundView[] = groundViews): GroundView[] {
  return views
    .map((view, index) => ({ view, index }))
    .sort((a, b) => {
      if (a.view.capturedAt && b.view.capturedAt) return b.view.capturedAt.localeCompare(a.view.capturedAt);
      if (a.view.capturedAt) return -1;
      if (b.view.capturedAt) return 1;
      return a.index - b.index;
    })
    .map(({ view }) => view);
}
