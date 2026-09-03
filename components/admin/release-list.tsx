"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { adminApi } from "@/lib/admin/api";
import { Panel, PanelHeader, ReleaseBadge } from "@/components/admin/ui";
import type { AdminRelease } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";

/**
 * The release history, and the transitions between states.
 *
 * Publishing is the point of no return - after it the records in the release
 * cannot be edited, so that a citation always resolves to the same data - and
 * so it asks for confirmation rather than happening on a single click.
 */
export function ReleaseList({
  slug,
  releases,
  canWrite,
  canPublish,
}: {
  slug: string;
  releases: AdminRelease[];
  canWrite: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [version, setVersion] = useState("");

  async function run(id: string, action: () => Promise<unknown>) {
    setBusy(id);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function createRelease() {
    if (!/^\d+\.\d+(\.\d+)?$/.test(version)) {
      setError("A version looks like 1.1 or 1.1.0.");
      return;
    }
    await run("new", async () => {
      await adminApi.createRelease(slug, version);
      setVersion("");
      setCreating(false);
    });
  }

  return (
    <Panel>
      <PanelHeader
        title="Releases"
        description="A published release is immutable, so a result cited from it can always be reproduced."
        actions={
          canWrite && !creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="button-secondary min-h-9 text-xs"
            >
              <Plus size={14} aria-hidden="true" />
              New draft
            </button>
          ) : null
        }
      />

      {creating ? (
        <div className="flex flex-wrap items-end gap-3 border-b border-line bg-paper px-5 py-4">
          <label className="block">
            <span className="field-label">Version</span>
            <input
              type="text"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="1.1"
              className="field-input h-10 w-32 font-mono text-[.8rem]"
            />
          </label>
          <button
            type="button"
            onClick={createRelease}
            className="button-primary min-h-10 text-xs"
            disabled={busy === "new"}
          >
            {busy === "new" ? <Loader2 size={14} className="animate-spin" /> : "Create draft"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setError(null);
            }}
            className="button-secondary min-h-10 text-xs"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 border-b border-line bg-white px-5 py-3 text-sm leading-5 text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-line">
        {releases.map((release) => (
          <li key={release.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <span className="font-mono text-sm font-medium">v{release.version}</span>
            <ReleaseBadge status={release.status} current={release.current} />
            <span className="text-xs text-muted">
              {release.publishedAt
                ? `published ${formatDate(release.publishedAt)}`
                : "not published"}
            </span>

            <span className="ml-auto flex flex-wrap gap-2">
              {release.status === "DRAFT" && canPublish ? (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Publish v${release.version}? Its records become immutable, which is what makes a citation reproducible. This cannot be undone.`,
                      )
                    ) {
                      return;
                    }
                    void run(release.id, () =>
                      adminApi.transitionRelease(release.id, "PUBLISHED"),
                    );
                  }}
                  className="button-primary min-h-9 text-xs"
                  disabled={busy === release.id}
                >
                  {busy === release.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Publish"
                  )}
                </button>
              ) : null}

              {release.status === "DRAFT" && canWrite ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Delete the draft v${release.version}?`)) return;
                    void run(release.id, () => adminApi.deleteRelease(release.id));
                  }}
                  className="button-secondary min-h-9 text-xs"
                  disabled={busy === release.id}
                >
                  Delete
                </button>
              ) : null}

              {release.status === "PUBLISHED" && canPublish ? (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Retire v${release.version}? It stays in the history so old citations still resolve, but stops being the current release.`,
                      )
                    ) {
                      return;
                    }
                    void run(release.id, () =>
                      adminApi.transitionRelease(release.id, "RETIRED"),
                    );
                  }}
                  className="button-secondary min-h-9 text-xs"
                  disabled={busy === release.id}
                >
                  Retire
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
