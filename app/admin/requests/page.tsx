import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { RequestStatus } from "@/components/admin/request-status";
import { EmptyState, Panel, TableShell, Td, Th, cx } from "@/components/admin/ui";
import { listDataRequests, type DataRequestStatus } from "@/lib/admin/data";
import { PERMISSIONS, requirePermission } from "@/lib/admin/session";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Data requests" };

const TABS: { label: string; status?: DataRequestStatus }[] = [
  { label: "Waiting", status: "PENDING" },
  { label: "Approved", status: "APPROVED" },
  { label: "Declined", status: "DECLINED" },
  { label: "All" },
];

const EMPTY: Record<string, string> = {
  PENDING: "Nothing is waiting for review. New requests appear here, and every reviewer is emailed when one arrives.",
  APPROVED: "No request has been approved yet.",
  DECLINED: "No request has been declined.",
  ALL: "No one has requested data yet. The public form is at /request-data.",
};

/**
 * Data requests, waiting ones first. The tab is in the address, so a reviewer
 * can bookmark "Waiting" and the back button returns to the same list.
 */
export default async function AdminRequests({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePermission(PERMISSIONS.requestReview, "/admin/requests");
  const { status: raw } = await searchParams;
  const status = raw === "ALL" ? undefined : ((["PENDING", "APPROVED", "DECLINED"].includes(raw ?? "") ? raw : "PENDING") as DataRequestStatus);
  const { requests, pending } = await listDataRequests(status);

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow text-sky">Requests</p>
        <h1 className="display mt-2 text-3xl leading-tight">Data requests</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Downloads are by request. Approving one emails the requester a private link to the collections they asked for; declining emails them
          your reason. Every decision is recorded in the audit log.
        </p>
      </header>

      <nav aria-label="Filter requests" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.status === status;
          return (
            <Link
              key={tab.label}
              href={tab.status ? `/admin/requests?status=${tab.status}` : "/admin/requests?status=ALL"}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active ? "border-sky bg-sky-pale text-sky-dark" : "border-line bg-white text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {tab.label}
              {tab.status === "PENDING" && pending > 0 ? (
                <span className="tabular rounded-full bg-sky px-1.5 text-[.68rem] font-bold text-white">{pending}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <Panel as="div">
        {requests.length === 0 ? (
          <EmptyState icon={<Inbox size={20} />} title="No requests here" description={EMPTY[status ?? "ALL"]} />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Requester</Th>
                <Th>Collections</Th>
                <Th>Received</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-paper">
                  <Td>
                    <Link href={`/admin/requests/${request.id}`} className="font-mono text-[.85rem] font-medium text-sky hover:underline">
                      {request.reference}
                    </Link>
                  </Td>
                  <Td>
                    <span className="block font-semibold text-ink">{request.name}</span>
                    <span className="block text-xs text-muted">{request.organisation}</span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs">{request.collections.join(", ")}</span>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(request.createdAt)}</Td>
                  <Td>
                    <RequestStatus status={request.status} />
                    {request.lastMailError ? <span className="ml-2 text-xs text-danger">mail failed</span> : null}
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/requests/${request.id}`}
                      aria-label={`Open ${request.reference}`}
                      className="inline-flex items-center text-sky hover:text-sky-dark"
                    >
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
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
