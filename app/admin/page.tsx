import Link from "next/link";
import { ArrowRight, ClipboardList, CloudOff, Images, Layers3, MapPinOff } from "lucide-react";
import { Badge, EmptyState, Fact, Facts, Panel, PanelHeader } from "@/components/admin/ui";
import { listAudit, listCollections } from "@/lib/admin/data";
import { PERMISSIONS, can, requireSession } from "@/lib/admin/session";
import { getArchiveStats } from "@/lib/api-client";

export const metadata = { title: "Overview" };

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const [user, { denied }] = await Promise.all([requireSession("/admin"), searchParams]);

  const [stats, collections, recent] = await Promise.all([
    getArchiveStats(),
    can(user, PERMISSIONS.catalogRead) ? listCollections() : Promise.resolve([]),
    can(user, PERMISSIONS.auditRead) ? listAudit({ limit: 6 }) : Promise.resolve([]),
  ]);

  // The point of the dashboard, stated as a number: how much of the archive
  // still has no site, no licence, no instrument.
  const missingProvenance = collections.filter((collection) => !collection.locationName);
  const missingLicence = collections.filter((collection) => !collection.license);

  return (
    <div className="grid gap-7">
      <header>
        <p className="eyebrow text-sky">Archive dashboard</p>
        <h1 className="display mt-2 text-3xl leading-tight sm:text-4xl">
          {user.fullName ? `Welcome, ${user.fullName.split(" ")[0]}` : "Overview"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Everything published here is what the public archive reports. Measurements come
          from the masks and cannot be edited; what you supply is the provenance a person
          knows and a pipeline does not.
        </p>
      </header>

      {denied ? (
        <p
          role="alert"
          className="border border-danger/40 bg-white px-4 py-3 text-sm leading-6 text-danger"
        >
          That page needs the <code className="font-mono">{denied}</code> permission, which
          your account does not have.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Images size={18} />}
          label="Frames"
          value={stats.total.toLocaleString()}
          note={`${stats.collections} sequences`}
        />
        <Stat
          icon={<Layers3 size={18} />}
          label="Segmented"
          value={stats.segmented.toLocaleString()}
          note="carry a mask and a measurement"
        />
        <Stat
          icon={<CloudOff size={18} />}
          label="Unsegmented"
          value={stats.unsegmented.toLocaleString()}
          note="report no cover at all"
        />
        <Stat
          icon={<MapPinOff size={18} />}
          label="Without a site"
          value={missingProvenance.length.toLocaleString()}
          note={`of ${collections.length} sequences`}
          tone={missingProvenance.length > 0 ? "attention" : "calm"}
        />
      </div>

      {can(user, PERMISSIONS.catalogWrite) && missingProvenance.length > 0 ? (
        <Panel>
          <PanelHeader
            title="Sequences with no provenance"
            description="These have no site, so the archive shows them as capture sequences rather than places. Supplying one changes the public page immediately."
          />
          <ul className="divide-y divide-line">
            {missingProvenance.slice(0, 6).map((collection) => (
              <li key={collection.slug}>
                <Link
                  href={`/admin/collections/${collection.slug}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm hover:bg-paper"
                >
                  <span>
                    <span className="font-mono text-[.8rem]">{collection.slug}</span>
                    <span className="ml-3 text-muted">
                      {collection.images.toLocaleString()} frames
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    {!collection.license ? <Badge tone="draft">no licence</Badge> : null}
                    <ArrowRight size={15} className="text-muted" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {missingProvenance.length > 6 ? (
            <p className="border-t border-line px-5 py-3 text-xs text-muted">
              and {missingProvenance.length - 6} more
            </p>
          ) : null}
        </Panel>
      ) : null}

      <div className="grid gap-7 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="What is missing"
            description="Fields that are empty across the archive."
          />
          <div className="px-5">
            <Facts>
              <Fact label="Sites">
                {missingProvenance.length === 0
                  ? "Every sequence has one"
                  : `${missingProvenance.length} of ${collections.length} sequences have none`}
              </Fact>
              <Fact label="Licences">
                {missingLicence.length === 0
                  ? "Every sequence has one"
                  : `${missingLicence.length} of ${collections.length} sequences have none`}
              </Fact>
              <Fact label="Capture times">
                {stats.hasTimestamps
                  ? "Recorded"
                  : "None recorded, so the date filters stay hidden"}
              </Fact>
            </Facts>
          </div>
        </Panel>

        {can(user, PERMISSIONS.auditRead) ? (
          <Panel>
            <PanelHeader
              title="Recent changes"
              actions={
                <Link href="/admin/audit" className="text-xs font-bold text-sky hover:underline">
                  Full log
                </Link>
              }
            />
            {recent.length === 0 ? (
              <EmptyState
                icon={<ClipboardList size={20} />}
                title="Nothing changed yet"
                description="Every edit made here will be recorded, with what it changed and who made it."
              />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((entry) => (
                  <li key={entry.id} className="px-5 py-3 text-sm">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-mono text-[.78rem]">{entry.action}</span>
                      <span className="text-muted">{entry.entityId}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {entry.actor.email ?? "unknown"}
                      {entry.changed.length > 0 ? ` · ${entry.changed.join(", ")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
  tone = "calm",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone?: "calm" | "attention";
}) {
  return (
    <div className="border border-line bg-white p-5">
      <div className="flex items-center gap-2 text-muted">
        <span className={tone === "attention" ? "text-sky" : "text-line-strong"}>{icon}</span>
        <span className="text-xs font-bold uppercase tracking-[.09em]">{label}</span>
      </div>
      <p className="display tabular mt-3 text-3xl leading-none">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{note}</p>
    </div>
  );
}
