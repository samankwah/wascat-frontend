import type { Metadata } from "next";
import { connection } from "next/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RequestDataForm } from "@/components/request-data-form";
import { getCollections } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Request data",
  description: "Ask for WASCAT image files and metadata. Requests are reviewed and approved requesters receive a private download link.",
};

const STEPS: [string, string][] = [
  ["Tell us what you need", "Choose the collections and describe how the data will be used."],
  ["We review it", "The WASCAT team reads every request, usually within a few working days."],
  ["Download privately", "Approved requesters get an email with a private link that works for 7 days."],
];

/**
 * The way to the data while downloads are off: every request is reviewed,
 * and an approved one is answered with a private, expiring link.
 *
 * Arriving from a collection or an image page (?collection=…) ticks that
 * collection already.
 */
export default async function RequestDataPage({ searchParams }: { searchParams: Promise<{ collection?: string | string[] }> }) {
  // Request time, like every catalogue page, so the build needs no database.
  await connection();
  const [collections, { collection }] = await Promise.all([getCollections(), searchParams]);
  const asked = new Set(Array.isArray(collection) ? collection : collection ? [collection] : []);
  const options = collections.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    station: entry.locationName ?? undefined,
    images: entry.images,
  }));

  return (
    <>
      <Breadcrumbs everywhere trail={[{ label: "Home", href: "/" }, { label: "Request data" }]} />

      <header className="container-shell pt-12 md:pt-16">
        <p className="eyebrow text-sky">Request data</p>
        <h1 className="display mt-4 max-w-3xl text-[clamp(2.4rem,5vw,3.6rem)] leading-tight text-ink">Request archive data</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
          Image files and full collection downloads are shared on request. Tell us what you need and how you will use it, and we will email you a
          private download link once it is approved.
        </p>
      </header>

      <section className="container-shell grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <RequestDataForm collections={options} initial={options.filter((entry) => asked.has(entry.slug)).map((entry) => entry.slug)} />

        <aside className="lg:pt-1">
          <h2 className="eyebrow text-sky">How it works</h2>
          <ol className="mt-5 grid gap-5">
            {STEPS.map(([title, description], index) => (
              <li key={title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                <span className="tabular grid size-8 place-items-center rounded-full bg-sky-pale font-mono text-sm font-bold text-sky">{index + 1}</span>
                <span>
                  <span className="block text-sm font-bold text-ink">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{description}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8 rounded-xl border border-line bg-paper p-5">
            <p className="text-sm font-bold text-ink">What you receive</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Every source frame and segmentation mask in the collections you asked for, their metadata as CSV and JSON, and a file list for bulk
              download tools.
            </p>
          </div>
          <p className="mt-6 text-xs leading-5 text-muted">
            Questions? Email <a href="mailto:data@wascat.org" className="font-semibold text-sky hover:underline">data@wascat.org</a>.
          </p>
        </aside>
      </section>
    </>
  );
}
