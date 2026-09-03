import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { CollectionEditor } from "@/components/admin/collection-editor";
import { ReleaseList } from "@/components/admin/release-list";
import { Fact, Facts, Panel, PanelHeader } from "@/components/admin/ui";
import { listAudit, listCollections } from "@/lib/admin/data";
import { PERMISSIONS, can, requirePermission } from "@/lib/admin/session";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: (await params).slug };
}

export default async function AdminCollectionDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requirePermission(PERMISSIONS.catalogRead, `/admin/collections/${slug}`);

  const [collections, history] = await Promise.all([
    listCollections(),
    can(user, PERMISSIONS.auditRead)
      ? listAudit({ entityType: "collection", entityId: slug, limit: 10 })
      : Promise.resolve([]),
  ]);

  const collection = collections.find((entry) => entry.slug === slug);
  if (!collection) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/admin/collections"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-sky"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          All collections
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="display text-3xl leading-tight">
              {collection.locationName ?? `Capture sequence ${collection.slug}`}
            </h1>
            <p className="mt-1 font-mono text-sm text-muted">{collection.slug}</p>
          </div>
          <Link
            href={`/collections/${collection.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky hover:underline"
          >
            Public page
            <ExternalLink size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="grid gap-6">
          <CollectionEditor
            slug={collection.slug}
            editable={can(user, PERMISSIONS.catalogWrite)}
            initial={{
              locationName: collection.locationName ?? "",
              latitude: collection.coordinates?.latitude ?? null,
              longitude: collection.coordinates?.longitude ?? null,
              instrument: collection.instrument ?? "",
              license: collection.license ?? "",
              citation: collection.citation ?? "",
              doi: collection.doi ?? "",
              methodsUrl: collection.methodsUrl ?? "",
              publicationUrl: collection.publicationUrl ?? "",
            }}
          />

          <ReleaseList
            slug={collection.slug}
            releases={collection.releases}
            canWrite={can(user, PERMISSIONS.catalogWrite)}
            canPublish={can(user, PERMISSIONS.releasePublish)}
          />
        </div>

        <div className="grid content-start gap-6">
          <Panel>
            <PanelHeader
              title="What the pipeline measured"
              description="Counts, not claims. These follow the imagery and cannot be edited."
            />
            <div className="px-5">
              <Facts>
                <Fact label="Frames">{collection.images.toLocaleString()}</Fact>
                <Fact label="Segmented">
                  {collection.segmented.toLocaleString()} carry a mask
                </Fact>
                <Fact label="Unsegmented">
                  {(collection.images - collection.segmented).toLocaleString()} report no
                  cover
                </Fact>
                <Fact label="Mean cover">
                  {collection.meanCloudCoverOktas == null
                    ? undefined
                    : `${Math.round(collection.meanCloudCoverOktas)}/8`}
                </Fact>
                <Fact label="Sequences" mono>
                  {collection.videoIds.join(", ")}
                </Fact>
                <Fact label="Mask registration">
                  {collection.maskRegistration.some((entry) => entry.corrected)
                    ? collection.maskRegistration
                        .filter((entry) => entry.corrected)
                        .map((entry) => `${entry.videoId} at ${entry.scale.toFixed(4)}×`)
                        .join(", ")
                    : "Delivered at the same scale as the frames"}
                </Fact>
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
