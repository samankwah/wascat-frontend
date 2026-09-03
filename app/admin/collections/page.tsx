import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import {
  Badge,
  EmptyState,
  Panel,
  ReleaseBadge,
  TableShell,
  Td,
  Th,
} from "@/components/admin/ui";
import { listCollections } from "@/lib/admin/data";
import { PERMISSIONS, requirePermission } from "@/lib/admin/session";

export const metadata = { title: "Collections" };

export default async function AdminCollections() {
  await requirePermission(PERMISSIONS.catalogRead, "/admin/collections");
  const collections = await listCollections();

  const missing = collections.filter(
    (collection) => !collection.locationName || !collection.license,
  ).length;

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow text-sky">Catalogue</p>
        <h1 className="display mt-2 text-3xl leading-tight">Collections</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          A collection is one capture sequence. Its editorial metadata is not part of a
          release, so it can be corrected at any time - unlike the records inside a
          published release, which are immutable.
        </p>
      </header>

      {missing > 0 ? (
        <p className="border border-line bg-sky-pale px-4 py-3 text-sm leading-6 text-sky-dark">
          {missing} of {collections.length} sequences are missing a site or a licence. Until
          they have one, the archive shows them as capture sequences rather than places, and
          offers no citation.
        </p>
      ) : null}

      <Panel as="div">
        {collections.length === 0 ? (
          <EmptyState
            icon={<Layers3 size={20} />}
            title="No collections yet"
            description="Run the seed import to load the archive."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Sequence</Th>
                <Th>Site</Th>
                <Th align="right">Frames</Th>
                <Th align="right">Segmented</Th>
                <Th>Licence</Th>
                <Th>Releases</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.slug} className="hover:bg-paper">
                  <Td>
                    <Link
                      href={`/admin/collections/${collection.slug}`}
                      className="font-mono text-[.8rem] font-medium text-sky hover:underline"
                    >
                      {collection.slug}
                    </Link>
                  </Td>
                  <Td>
                    {collection.locationName ?? (
                      <span className="text-muted-dim">Not recorded</span>
                    )}
                  </Td>
                  <Td align="right" className="tabular">
                    {collection.images.toLocaleString()}
                  </Td>
                  <Td align="right" className="tabular text-muted">
                    {collection.segmented.toLocaleString()}
                  </Td>
                  <Td>
                    {collection.license ? (
                      <span className="text-sm">{collection.license}</span>
                    ) : (
                      <Badge tone="draft">none</Badge>
                    )}
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1.5">
                      {collection.releases.map((release) => (
                        <ReleaseBadge
                          key={release.id}
                          status={release.status}
                          current={release.current}
                        />
                      ))}
                    </span>
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/collections/${collection.slug}`}
                      className="inline-flex items-center text-muted hover:text-sky"
                      aria-label={`Edit ${collection.slug}`}
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
