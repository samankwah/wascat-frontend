"use client";

import { useState } from "react";
import { ArrowDownToLine, Loader2 } from "lucide-react";

type DataFile = {
  record: string;
  type: string;
  name: string;
  bytes: number;
  checksum: string;
  url: string;
};

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024)).toLocaleString()} KB`;

/**
 * A collection's files behind a private link, fetched a page at a time and
 * only when asked for: a collection can hold thousands, and every link is
 * signed on the server as the page is read.
 *
 * Links open without a referrer, so the private page's address never travels
 * to the storage host with the request.
 */
export function DataFiles({ token, slug, records }: { token: string; slug: string; records: number }) {
  const [files, setFiles] = useState<DataFile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function load(from: string | null) {
    setPending(true);
    setProblem(null);
    try {
      const query = from ? `?cursor=${encodeURIComponent(from)}` : "";
      const response = await fetch(
        `/api/v1/data-requests/access/${encodeURIComponent(token)}/collections/${encodeURIComponent(slug)}/files${query}`,
        { cache: "no-store" },
      );
      if (response.status === 410) {
        setProblem("This link has expired. Reload the page for details.");
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      const body = (await response.json()) as { data: DataFile[]; meta: { nextCursor: string | null } };
      setFiles((current) => [...current, ...body.data]);
      setCursor(body.meta.nextCursor);
      setLoaded(true);
    } catch {
      setProblem("The file list could not be loaded. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!loaded) {
    return (
      <div className="mt-5">
        <button type="button" className="button-secondary" onClick={() => load(null)} disabled={pending}>
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
          Browse files
        </button>
        {problem ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {problem}
          </p>
        ) : null}
      </div>
    );
  }

  const shownRecords = new Set(files.map((file) => file.record)).size;

  return (
    <div className="mt-5">
      <ul className="divide-y divide-line border-y border-line">
        {files.map((file) => (
          <li key={`${file.record}-${file.type}`} className="flex items-center justify-between gap-4 py-2.5">
            <span className="min-w-0">
              <span className="block truncate font-mono text-xs text-ink">
                {file.record} · {file.name}
              </span>
              <span className="block text-xs text-muted">
                {file.type === "source" ? "Source frame" : "Segmentation mask"} · {kb(file.bytes)} · SHA-256 {file.checksum.slice(0, 10)}…
              </span>
            </span>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              aria-label={`Download ${file.name} from ${file.record}`}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-ink hover:border-sky hover:text-sky"
            >
              <ArrowDownToLine size={15} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="tabular text-xs text-muted" aria-live="polite">
          Files from {shownRecords.toLocaleString()} of {records.toLocaleString()} records
        </p>
        {cursor ? (
          <button type="button" className="button-secondary" onClick={() => load(cursor)} disabled={pending}>
            {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
            Load more
          </button>
        ) : null}
      </div>
      {problem ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {problem}
        </p>
      ) : null}
    </div>
  );
}
