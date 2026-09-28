import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryColumns, Donut, DottedTrend, HistogramBars } from "@/components/stats/charts";
import { getStats } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Statistics",
  description: "Scientific analytics and distribution analysis of the WASCAT archive.",
};

/**
 * Illustrative frames per UTC hour, 0:00-23:00: a daylight-only camera with
 * morning and late-afternoon peaks. Shown only while no frame has a capture
 * time, and always badged as sample data.
 */
const SAMPLE_HOURLY_COUNTS = [0, 0, 0, 0, 0, 0, 4, 2, 7, 5, 4, 5, 2, 0, 3, 1, 3, 6, 6, 0, 0, 0, 0, 0];

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

export default async function StatisticsPage() {
  // Render at request time rather than at build, like every catalogue page:
  // prerendering would make `next build` need a reachable database.
  await connection();

  const { totals, byLocation, cloudTypes, byHourUtc, coverageHistogram, growth } = await getStats();
  const byCollection = byLocation.basis === "collections";

  const kpis: [string, string][] = [
    [totals.images.toLocaleString("en-GB"), "Cloud images"],
    [totals.sites.toLocaleString("en-GB"), byCollection ? "Collections" : "Observation sites"],
    [totals.processedPct == null ? "-" : `${totals.processedPct}%`, "Segmented"],
    [totals.avgCoveragePct == null ? "-" : `${Math.round(totals.avgCoveragePct)}%`, "Avg coverage"],
  ];

  // No frame carries a capture time yet, so until one does the chart shows an
  // illustrative daytime curve, badged as sample data on the card. The real
  // distribution replaces it automatically.
  const sampleHours = !byHourUtc.hasTimestamps;
  const hours = sampleHours
    ? SAMPLE_HOURLY_COUNTS.map((count, hour) => ({ label: `${hour}:00`, count }))
    : byHourUtc.items.map((item) => ({ label: `${item.hour}:00`, count: item.count }));

  // Growth over time needs at least two time buckets. Until capture times
  // arrive every frame shares one ingest date, so the curve is drawn over the
  // capture sequences instead - still a real cumulative count, and labelled
  // as such.
  const overTime = growth.items.length > 1;
  let running = 0;
  const growthPoints = overTime
    ? growth.items.map((item) => ({ label: monthLabel(item.month), count: item.cumulative }))
    : byLocation.items.map((item) => ({ label: item.value ?? item.label, count: (running += item.count) }));

  return (
    <>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Statistics" }]} />
      <div className="relative overflow-hidden bg-paper text-ink">
        {/* The home hero's sky wash, fading out down the page. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-sky-wash to-transparent" />

        <div className="container-shell relative py-12 md:py-16">
          <p className="inline-flex rounded-full bg-white px-3 py-1 font-mono text-[.71rem] font-semibold uppercase tracking-[.14em] text-sky ring-1 ring-sky/40">
            Analytics dashboard
          </p>
          <h1 className="mt-4 text-[clamp(2.4rem,5vw,3.4rem)] font-bold leading-tight tracking-tight text-ink">Dataset Statistics</h1>
          <p className="mt-2 text-[1.05rem] text-muted">Scientific analytics and distribution analysis</p>

          <section className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Archive totals">
            {kpis.map(([value, label]) => (
              <div key={label} className="relative overflow-hidden rounded-xl border border-line bg-white px-5 py-5 shadow-[0_2px_8px_rgba(27,73,103,.06)] sm:py-6">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-vivid/70 to-transparent" />
                <p className="tabular bg-gradient-to-r from-sky-vivid to-sky bg-clip-text font-mono text-3xl font-semibold text-transparent sm:text-4xl">{value}</p>
                <p className="mt-2 font-mono text-[.71rem] uppercase tracking-[.2em] text-muted-dim sm:text-xs">{label}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            <ChartCard
              title={byCollection ? "Images by Collection" : "Images by Location"}
              subtitle={byCollection ? "Observation count per capture sequence" : "Observation count per site"}
            >
              {byLocation.items.length ? <CategoryColumns data={byLocation.items} /> : <EmptyChart>No published images yet.</EmptyChart>}
            </ChartCard>

            <ChartCard title="Cloud-Type Distribution" subtitle="Classification breakdown">
              {cloudTypes.items.length ? <Donut data={cloudTypes.items} /> : <EmptyChart>No image has a cloud type yet.</EmptyChart>}
            </ChartCard>

            <ChartCard
              title="Temporal Distribution"
              subtitle={sampleHours ? "Observations by hour of day (UTC) · sample data until capture times are recorded" : "Observations by hour of day (UTC)"}
              badge={sampleHours ? "Sample data" : undefined}
            >
              <DottedTrend data={hours} slantLabels />
            </ChartCard>

            <ChartCard title="Cloud Coverage Distribution" subtitle="Histogram of sky coverage">
              <HistogramBars data={coverageHistogram} />
            </ChartCard>

            <ChartCard
              className="lg:col-span-2"
              title="Dataset Growth"
              subtitle={overTime ? "Cumulative image count over time" : "Cumulative image count across capture sequences"}
            >
              {growthPoints.length ? <DottedTrend data={growthPoints} tone="cyan" height={320} /> : <EmptyChart>No published images yet.</EmptyChart>}
            </ChartCard>
          </section>

        </div>
      </div>
    </>
  );
}

function ChartCard({
  title,
  subtitle,
  badge,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article className={`rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(27,73,103,.06)] sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {badge && (
          <span className="shrink-0 rounded-full bg-lime px-2.5 py-0.5 font-mono text-[.67rem] font-semibold uppercase tracking-[.14em] text-lime-ink">{badge}</span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function EmptyChart({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-line-strong bg-paper px-6 text-center text-sm leading-6 text-muted">
      <p className="max-w-sm">{children}</p>
    </div>
  );
}
