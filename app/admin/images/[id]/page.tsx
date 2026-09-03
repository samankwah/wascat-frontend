import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Lock } from "lucide-react";
import { ArtifactUpload } from "@/components/admin/artifact-upload";
import { RecordEditor } from "@/components/admin/record-editor";
import {
  Badge,
  CoverBadge,
  Fact,
  Facts,
  Panel,
  PanelHeader,
  ReleaseBadge,
} from "@/components/admin/ui";
import { getImage, listAudit } from "@/lib/admin/data";
import { PERMISSIONS, can, requirePermission } from "@/lib/admin/session";
import { formatDate } from "@/lib/format";
import { getFacets } from "@/lib/api-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: (await params).id };
}

export default async function AdminImageDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePermission(PERMISSIONS.catalogRead, `/admin/images/${id}`);

  const [record, facets, history] = await Promise.all([
    getImage(id),
    getFacets(),
    can(user, PERMISSIONS.auditRead)
      ? listAudit({ entityType: "image_record", entityId: id, limit: 10 })
      : Promise.resolve([]),
  ]);

  if (!record) notFound();

  const editable = record.editable && can(user, PERMISSIONS.catalogWrite);

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/admin/images"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-sky"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          All records
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="display font-mono text-2xl leading-tight">{record.id}</h1>
            <p className="mt-1 text-sm text-muted">
              {record.videoId} · frame {record.frameIndex.toLocaleString()} ·{" "}
              {record.width}×{record.height}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CoverBadge oktas={record.cloudCoverOktas} />
            {record.release ? (
              <ReleaseBadge status={record.release.status} current={record.release.current} />
            ) : null}
            <Link
              href={`/images/${record.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky hover:underline"
            >
              Public page
              <ExternalLink size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {!record.editable ? (
        <p className="flex items-start gap-2 border border-line bg-sky-pale px-4 py-3 text-sm leading-6 text-sky-dark">
          <Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          This record belongs to release {record.release?.version}, which is{" "}
          {record.release?.status.toLowerCase()}. Published releases are immutable, so
          reproducing a result from a citation always gives the same data. To correct
          something, create a new release.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="grid gap-6">
          <Panel>
            <PanelHeader
              title="What was measured"
              description="Derived from the mask by the ingest pipeline. Not editable - a person cannot assert a measurement nobody made."
            />
            <div className="px-5">
              <Facts>
                <Fact label="Cloud cover">
                  {record.cloudCoverOktas == null ? (
                    <span className="text-muted-dim">
                      No mask, so no measurement. Not zero.
                    </span>
                  ) : (
                    `${record.cloudCoverOktas}/8 · ${((record.cloudFraction ?? 0) * 100).toFixed(1)}% of the field of view`
                  )}
                </Fact>
                <Fact label="Mask scale" mono>
                  {record.maskScale === 1
                    ? "1 (registered as delivered)"
                    : `${record.maskScale.toFixed(6)} (rescaled for display)`}
                </Fact>
                <Fact label="Dimensions" mono>
                  {record.width} × {record.height}
                </Fact>
                <Fact label="Artifacts">
                  <span className="flex flex-wrap gap-1.5">
                    {record.artifacts.map((artifact) => (
                      <Badge key={artifact.type}>{artifact.type}</Badge>
                    ))}
                  </span>
                </Fact>
                {record.artifacts.map((artifact) => (
                  <Fact key={artifact.objectKey} label={`${artifact.type} checksum`} mono>
                    {artifact.checksum.slice(0, 16)}…
                  </Fact>
                ))}
              </Facts>
            </div>
          </Panel>

          <ArtifactUpload
            recordId={record.id}
            editable={editable}
            expected={{ width: record.width, height: record.height }}
            present={{ source: record.hasSource, mask: record.hasMask }}
          />

          <RecordEditor
            recordId={record.id}
            editable={editable}
            initial={{
              capturedAt: record.capturedAt ?? "",
              location: record.location ?? "",
              latitude: record.coordinates?.latitude ?? null,
              longitude: record.coordinates?.longitude ?? null,
              instrument: record.instrument ?? "",
              season: record.season ?? "",
              timeOfDay: record.timeOfDay ?? "",
              conditionTags: record.conditionTags ?? [],
            }}
            seasons={facets.seasons.map((entry) => String(entry.value))}
            timesOfDay={facets.timesOfDay.map((entry) => String(entry.value))}
          />
        </div>

        <div className="grid content-start gap-6">
          <Panel>
            <PanelHeader title="Preview" />
            <div className="p-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- the
                  object store host varies by environment and this is an
                  internal tool; next/image would need a remotePattern per
                  deployment for no user-visible benefit here. */}
              <img
                src={record.image}
                alt={record.alt}
                className="w-full border border-line bg-line-soft"
                loading="lazy"
              />
              <p className="mt-3 text-xs leading-5 text-muted">{record.alt}</p>
            </div>
          </Panel>

          {history.length > 0 ? (
            <Panel>
              <PanelHeader title="History" description="Every change to this record." />
              <ul className="divide-y divide-line">
                {history.map((entry) => (
                  <li key={entry.id} className="px-5 py-3">
                    <p className="text-sm font-medium">
                      {entry.summary || entry.action}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {entry.actor.email ?? "unknown"} ·{" "}
                      {formatDate(entry.createdAt, true)}
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
