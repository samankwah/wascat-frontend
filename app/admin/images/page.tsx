import Image from "next/image";
import Link from "next/link";
import { ImageOff, Search } from "lucide-react";
import {
  Badge,
  CoverBadge,
  EmptyState,
  Panel,
  TableShell,
  Td,
  Th,
} from "@/components/admin/ui";
import { listImages } from "@/lib/admin/data";
import { PERMISSIONS, requirePermission } from "@/lib/admin/session";
import { getFacets } from "@/lib/api-client";
import { decodeOffsetCursor, encodeOffsetCursor, imageQuerySchema } from "@/lib/search";

export const metadata = { title: "Image records" };

const PAGE_SIZE = 25;

export default async function AdminImages({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission(PERMISSIONS.catalogRead, "/admin/images");
  const params = await searchParams;

  // The same query contract the public Explore uses, so a filter built there
  // can be pasted here and mean the same thing.
  const parsed = imageQuerySchema.safeParse({ ...params, limit: PAGE_SIZE });
  const query = parsed.success ? parsed.data : imageQuerySchema.parse({ limit: PAGE_SIZE });
  const offset = decodeOffsetCursor(query.cursor);

  const [facets, page] = await Promise.all([
    getFacets(),
    listImages({
      ...(Object.fromEntries(
        Object.entries(query).filter(([key, value]) => key !== "cursor" && value !== undefined),
      ) as Record<string, string | number>),
      cursor: encodeOffsetCursor(offset),
    }),
  ]);

  const current = (name: string) => {
    const value = params[name];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  const pageHref = (cursor?: string) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "cursor" || value === undefined) continue;
      next.set(key, Array.isArray(value) ? value[0] : value);
    }
    if (cursor) next.set("cursor", cursor);
    return `/admin/images${next.size ? `?${next.toString()}` : ""}`;
  };

  const shown = page.records.length;
  const from = shown === 0 ? 0 : offset + 1;
  const to = offset + shown;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-sky">Catalogue</p>
          <h1 className="display mt-2 text-3xl leading-tight">Image records</h1>
          <p className="mt-2 text-sm text-muted">
            {page.total.toLocaleString()} frames match. Cloud cover is measured from the
            mask and cannot be edited here.
          </p>
        </div>
      </header>

      <Panel as="div">
        <form method="get" className="grid gap-4 p-5 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="field-label">Search</span>
            <span className="relative block">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                name="q"
                defaultValue={current("q")}
                placeholder="Record id, sequence, frame…"
                className="field-input pl-9"
              />
            </span>
          </label>

          <label className="block">
            <span className="field-label">Sequence</span>
            <select name="video" defaultValue={current("video")} className="field-select">
              <option value="">All</option>
              {facets.sequences.map((entry) => (
                <option key={String(entry.value)} value={String(entry.value)}>
                  {String(entry.value)} ({entry.count.toLocaleString()})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Segmentation</span>
            <select name="segmented" defaultValue={current("segmented")} className="field-select">
              <option value="">Any</option>
              <option value="true">Has a mask</option>
              <option value="false">Not yet segmented</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">Cloud cover</span>
            <select name="oktas" defaultValue={current("oktas")} className="field-select">
              <option value="">Any measured</option>
              {facets.cloudCoverOktas.map((entry) => (
                <option key={String(entry.value)} value={String(entry.value)}>
                  {entry.label} ({entry.count.toLocaleString()})
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button type="submit" className="button-primary">
              Filter
            </button>
            <Link href="/admin/images" className="button-secondary">
              Clear
            </Link>
          </div>
        </form>
      </Panel>

      <Panel as="div">
        {page.records.length === 0 ? (
          <EmptyState
            icon={<ImageOff size={20} />}
            title="No records match"
            description="Try widening the cloud-cover range or clearing a filter."
            action={
              <Link href="/admin/images" className="button-secondary">
                Clear filters
              </Link>
            }
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th className="w-[4.5rem]">Frame</Th>
                  <Th>Record</Th>
                  <Th>Sequence</Th>
                  <Th>Cloud cover</Th>
                  <Th>Artifacts</Th>
                  <Th>Provenance</Th>
                  <Th align="right">Release</Th>
                </tr>
              </thead>
              <tbody>
                {page.records.map((record) => (
                  <tr key={record.id} className="hover:bg-paper">
                    <Td>
                      <span className="relative block size-11 overflow-hidden bg-line-soft">
                        <Image
                          src={record.image}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/images/${record.id}`}
                        className="font-mono text-[.8rem] font-medium text-sky hover:underline"
                      >
                        {record.id}
                      </Link>
                    </Td>
                    <Td className="text-muted">
                      {record.videoId} · frame {record.frameIndex.toLocaleString()}
                    </Td>
                    <Td>
                      <CoverBadge oktas={record.cloudCoverOktas} />
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {record.hasSource ? <Badge>source</Badge> : null}
                        {record.hasMask ? <Badge>mask</Badge> : null}
                      </span>
                    </Td>
                    <Td className="text-muted">
                      {record.location ?? record.capturedAt ?? (
                        <span className="text-muted-dim">None recorded</span>
                      )}
                    </Td>
                    <Td align="right" className="font-mono text-[.78rem] text-muted">
                      v{record.release}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>

            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            >
              <p className="tabular text-xs text-muted">
                {from.toLocaleString()}–{to.toLocaleString()} of{" "}
                {page.total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                {offset > 0 ? (
                  <Link
                    href={pageHref(
                      offset - PAGE_SIZE > 0
                        ? encodeOffsetCursor(offset - PAGE_SIZE)
                        : undefined,
                    )}
                    className="button-secondary min-h-9 text-xs"
                  >
                    Previous
                  </Link>
                ) : null}
                {offset + PAGE_SIZE < page.total ? (
                  <Link
                    href={pageHref(encodeOffsetCursor(offset + PAGE_SIZE))}
                    className="button-secondary min-h-9 text-xs"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </nav>
          </>
        )}
      </Panel>
    </div>
  );
}
