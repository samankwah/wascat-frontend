import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RequestDecision } from "@/components/admin/request-decision";
import { RequestStatus } from "@/components/admin/request-status";
import { Fact, Facts, Panel, PanelHeader } from "@/components/admin/ui";
import { getDataRequest, listAudit } from "@/lib/admin/data";
import { PERMISSIONS, can, requirePermission } from "@/lib/admin/session";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const request = await getDataRequest((await params).id).catch(() => null);
  return { title: request ? `Request ${request.reference}` : "Data request" };
}

/**
 * One request: who is asking, what for, and the decision. The decision panel
 * is first in reading order because it is why a reviewer is here.
 */
export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission(PERMISSIONS.requestReview, `/admin/requests/${id}`);
  const [request, history] = await Promise.all([
    getDataRequest(id),
    can(user, PERMISSIONS.auditRead) ? listAudit({ entityType: "data_request", entityId: id, limit: 10 }) : Promise.resolve([]),
  ]);
  if (!request) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/requests" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-sky">
          <ArrowLeft size={14} aria-hidden="true" />
          All requests
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="display text-3xl leading-tight">{request.name}</h1>
          <RequestStatus status={request.status} />
        </div>
        <p className="mt-1 font-mono text-sm text-muted">
          {request.reference} · received {formatDate(request.createdAt, true)}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="grid content-start gap-6">
          <Panel>
            <PanelHeader title="What the data is for" description="In the requester's own words." />
            <p className="whitespace-pre-line px-5 pb-5 leading-7 text-ink">{request.purpose}</p>
          </Panel>
          <RequestDecision request={request} />
        </div>

        <div className="grid content-start gap-6">
          <Panel>
            <PanelHeader title="Requester" />
            <div className="px-5">
              <Facts>
                <Fact label="Name">{request.name}</Fact>
                <Fact label="Email">
                  <a href={`mailto:${request.email}?subject=${encodeURIComponent(`Your WASCAT data request ${request.reference}`)}`} className="text-sky hover:underline">
                    {request.email}
                  </a>
                </Fact>
                <Fact label="Organisation">{request.organisation}</Fact>
                <Fact label="Collections">
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {request.collections.map((slug) => (
                      <Link key={slug} href={`/admin/collections/${slug}`} className="font-mono text-sky hover:underline">
                        {slug}
                      </Link>
                    ))}
                  </span>
                </Fact>
                <Fact label="Reviewers emailed">
                  {request.adminsNotifiedAt ? formatDate(request.adminsNotifiedAt, true) : undefined}
                </Fact>
                {request.reviewedAt ? <Fact label="Decided">{formatDate(request.reviewedAt, true)}</Fact> : null}
              </Facts>
            </div>
          </Panel>

          {history.length > 0 ? (
            <Panel>
              <PanelHeader title="History" />
              <ul className="divide-y divide-line">
                {history.map((entry) => (
                  <li key={entry.id} className="px-5 py-3">
                    <p className="text-sm font-medium">{entry.summary || entry.action}</p>
                    <p className="mt-1 text-xs text-muted">
                      {entry.actor.email ?? "unknown"} · {formatDate(entry.createdAt, true)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
