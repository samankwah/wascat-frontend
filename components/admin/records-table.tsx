"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BulkEditBar } from "@/components/admin/bulk-edit";
import { Badge, CoverBadge, TableShell, Td, Th } from "@/components/admin/ui";
import type { ImageRecord } from "@/lib/types";

/**
 * The records table, with selection.
 *
 * Selection exists because of scale: a sequence runs to thousands of frames,
 * and a capture team supplies a site or an instrument for the whole sequence
 * at once. Editing them one at a time is not a slower route to the same
 * place, it is a route nobody finishes.
 *
 * "Select all" selects the page, not the query, and says so. A checkbox that
 * silently meant "all 15,442 matching records" would be the most dangerous
 * control on the page.
 */
export function RecordsTable({
  records,
  editable,
  seasons,
  timesOfDay,
}: {
  records: ImageRecord[];
  editable: boolean;
  seasons: string[];
  timesOfDay: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allOnPage = records.length > 0 && records.every((record) => selected.has(record.id));

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((current) => {
      const next = new Set(current);
      if (allOnPage) records.forEach((record) => next.delete(record.id));
      else records.forEach((record) => next.add(record.id));
      return next;
    });

  return (
    <>
      <TableShell>
        <thead>
          <tr>
            {editable ? (
              <Th className="w-10">
                <input
                  type="checkbox"
                  checked={allOnPage}
                  onChange={togglePage}
                  aria-label="Select every record on this page"
                  className="size-4 accent-sky"
                />
              </Th>
            ) : null}
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
          {records.map((record) => (
            <tr
              key={record.id}
              className={selected.has(record.id) ? "bg-sky-pale" : "hover:bg-paper"}
            >
              {editable ? (
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(record.id)}
                    onChange={() => toggle(record.id)}
                    aria-label={`Select ${record.id}`}
                    className="size-4 accent-sky"
                  />
                </Td>
              ) : null}
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

      {editable && selected.size > 0 ? (
        <>
          <p className="border-t border-line px-5 py-2 text-xs text-muted">
            {selected.size.toLocaleString()} selected on this page. Selecting all here
            covers the {records.length} records shown, not every record matching the
            filter.
          </p>
          <BulkEditBar
            selected={[...selected]}
            seasons={seasons}
            timesOfDay={timesOfDay}
            onDone={() => setSelected(new Set())}
            onClear={() => setSelected(new Set())}
          />
        </>
      ) : null}
    </>
  );
}
