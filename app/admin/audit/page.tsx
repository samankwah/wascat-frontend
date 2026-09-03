import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { EmptyState, Panel, TableShell, Td, Th } from "@/components/admin/ui";
import { listAudit } from "@/lib/admin/data";
import { PERMISSIONS, requirePermission } from "@/lib/admin/session";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Audit log" };

const ACTIONS = [
  { value: "", label: "Everything" },
  { value: "collection", label: "Collections" },
  { value: "image_record", label: "Image records" },
  { value: "release", label: "Releases" },
];

export default async function AdminAudit({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entityId?: string }>;
}) {
  await requirePermission(PERMISSIONS.auditRead, "/admin/audit");
  const { action, entityId } = await searchParams;

  const entries = await listAudit({ action, entityId, limit: 100 });

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow text-sky">Provenance</p>
        <h1 className="display mt-2 text-3xl leading-tight">Audit log</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Every change made through the dashboard, with what it changed and who made it.
          This is a scientific archive: where a number came from matters as much as what
          it says, and that includes the numbers a person edited.
        </p>
      </header>

      <Panel as="div">
        <form method="get" className="flex flex-wrap items-end gap-3 border-b border-line p-5">
          <label className="block">
            <span className="field-label">Kind</span>
            <select name="action" defaultValue={action ?? ""} className="field-select h-10 w-48">
              {ACTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Entity</span>
            <input
              type="text"
              name="entityId"
              defaultValue={entityId ?? ""}
              placeholder="vid1 or WAS-V01-F5"
              className="field-input h-10 w-56 font-mono text-[.8rem]"
            />
          </label>
          <button type="submit" className="button-primary min-h-10 text-xs">
            Filter
          </button>
          <Link href="/admin/audit" className="button-secondary min-h-10 text-xs">
            Clear
          </Link>
        </form>

        {entries.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={20} />}
            title="Nothing recorded yet"
            description="Changes made through the dashboard appear here, with the value before and after."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Changed</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="align-top hover:bg-paper">
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate(entry.createdAt, true)}
                  </Td>
                  <Td>{entry.actor.email ?? <span className="text-muted-dim">system</span>}</Td>
                  <Td className="font-mono text-[.78rem]">{entry.action}</Td>
                  <Td>
                    <Link
                      href={
                        entry.entityType === "collection"
                          ? `/admin/collections/${entry.entityId}`
                          : entry.entityType === "image_record"
                            ? `/admin/images/${entry.entityId}`
                            : `/admin/audit?entityId=${encodeURIComponent(entry.entityId)}`
                      }
                      className="font-mono text-[.78rem] text-sky hover:underline"
                    >
                      {entry.entityId}
                    </Link>
                  </Td>
                  <Td>
                    {entry.changed.length === 0 ? (
                      <span className="text-muted-dim">{entry.summary ?? "—"}</span>
                    ) : (
                      <ul className="grid gap-1">
                        {entry.changed.map((field) => (
                          <li key={field} className="text-xs">
                            <span className="font-bold">{field}</span>
                            <span className="text-muted">
                              {" "}
                              {formatValue(entry.before?.[field])} →{" "}
                              {formatValue(entry.after?.[field])}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </div>
  );
}

/** Render a logged value, distinguishing "cleared" from "empty string". */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "not recorded";
  if (value === "") return "empty";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "none";
  return String(value);
}
