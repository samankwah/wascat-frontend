import type { Metadata } from "next";
import Link from "next/link";
import { FileJson2, FileSpreadsheet, ListChecks } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { DataFiles } from "@/components/data-files";
import { getDataAccess } from "@/lib/data-access";
import { formatDate } from "@/lib/format";

// One requester's page: never indexed, and never sending its address (which
// carries the token) to anywhere a link on it leads.
export const metadata: Metadata = {
  title: "Your data",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * What an approved data request can download, reached from the approval email.
 *
 * Read fresh on every visit: the links on it are signed as it loads, and it
 * stops working when the access expires.
 */
export default async function DataAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getDataAccess(token);

  if (result.state !== "ok") {
    const expired = result.state === "expired";
    return (
      <section className="container-shell py-20 md:py-28">
        <p className="eyebrow text-sky">Your data</p>
        <h1 className="display mt-4 text-4xl leading-tight md:text-5xl">{expired ? "This link has expired" : "This link is not valid"}</h1>
        <p className="mt-4 max-w-xl leading-7 text-muted">
          {expired
            ? "Download links work for a limited time. Reply to your approval email, or write to data@wascat.org, and we will send a new one."
            : "Check that you copied the whole link from your email. If it still does not work, write to data@wascat.org."}
        </p>
        <Link href="/request-data" className="button-secondary mt-8">
          Make a new request
        </Link>
      </section>
    );
  }

  const { access, daysLeft } = result;
  const base = `/api/v1/data-requests/access/${encodeURIComponent(token)}/collections`;

  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="container-shell py-12 md:py-16">
          <p className="eyebrow text-sky">Your data · {access.reference}</p>
          <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.4rem)] leading-tight text-ink">Hello {access.name}, your data is ready</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">
            This page is private to you.
            {access.expiresAt ? (
              <>
                {" "}
                It works until <strong className="text-ink">{formatDate(access.expiresAt, true)}</strong>
                {daysLeft !== undefined ? ` (${daysLeft === 1 ? "1 day" : `${daysLeft} days`} left)` : ""}.
              </>
            ) : null}{" "}
            Please don&apos;t share the link.
          </p>
          {access.note ? (
            <div className="mt-6 max-w-2xl rounded-lg border border-line bg-white px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-dim">A note from the reviewer</p>
              <p className="mt-1.5 whitespace-pre-line leading-7 text-ink">{access.note}</p>
            </div>
          ) : null}
        </div>
      </header>

      <div className="container-shell grid gap-8 py-12 md:py-16">
        {access.collections.map((collection) => (
          <section key={collection.slug} className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby={`collection-${collection.slug}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 id={`collection-${collection.slug}`} className="display text-2xl leading-tight md:text-3xl">
                {collection.title}
              </h2>
              <p className="font-mono text-xs text-muted">
                {collection.slug}
                {collection.release ? ` · release ${collection.release}` : ""} · {collection.records.toLocaleString()} records
              </p>
            </div>
            {collection.locationName ? <p className="mt-1 text-sm text-muted">{collection.locationName}</p> : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <DownloadLink href={`${base}/${collection.slug}/metadata.csv`} icon={<FileSpreadsheet size={18} aria-hidden />} title="Metadata (CSV)" detail="One row per record" />
              <DownloadLink href={`${base}/${collection.slug}/metadata.json`} icon={<FileJson2 size={18} aria-hidden />} title="Metadata (JSON)" detail="Every field, as the API returns it" />
              <DownloadLink href={`${base}/${collection.slug}/manifest.txt`} icon={<ListChecks size={18} aria-hidden />} title="File list" detail="Every file's link, for wget -i" />
            </div>

            <DataFiles token={token} slug={collection.slug} records={collection.records} />

            {collection.license || collection.citation ? (
              <div className="mt-6 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
                {collection.license ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-dim">Licence</p>
                    <p className="mt-1 text-ink">{collection.license}</p>
                  </div>
                ) : null}
                {collection.citation ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-dim">Cite as</p>
                    <p className="mt-1 leading-6 text-ink">{collection.citation}</p>
                    <CopyButton value={collection.doi ? `${collection.citation} https://doi.org/${collection.doi}` : collection.citation} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ))}

        <p className="text-sm leading-6 text-muted">
          File links on this page and in the file list are signed when you open the page and last a day at most; reload the page for fresh ones.
          Questions? Write to <a href="mailto:data@wascat.org" className="font-semibold text-sky hover:underline">data@wascat.org</a>.
        </p>
      </div>
    </>
  );
}

function DownloadLink({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <a
      href={href}
      download
      className="flex items-start gap-3 rounded-lg border border-line px-4 py-3 transition-colors hover:border-sky hover:bg-sky-pale motion-reduce:transition-none"
    >
      <span className="mt-0.5 text-sky">{icon}</span>
      <span>
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
    </a>
  );
}
