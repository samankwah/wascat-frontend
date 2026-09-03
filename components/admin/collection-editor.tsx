"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { AdminApiError, adminApi } from "@/lib/admin/api";
import { Panel, PanelHeader, cx } from "@/components/admin/ui";

type Editorial = {
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  instrument: string;
  license: string;
  citation: string;
  doi: string;
  methodsUrl: string;
  publicationUrl: string;
};

/**
 * A collection's editorial metadata.
 *
 * This is the form that closes the gap the whole dashboard was built for:
 * every one of these fields is empty for all eleven sequences, which is why
 * the site shows no sites, no instruments and no citations. Saving one changes
 * the public archive on the next request.
 *
 * Unlike a record's provenance, none of this belongs to a release, so it stays
 * editable after publication - a licence can be corrected without reissuing
 * the data it describes.
 */
export function CollectionEditor({
  slug,
  editable,
  initial,
}: {
  slug: string;
  editable: boolean;
  initial: Editorial;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Editorial>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Editorial>(key: K, value: Editorial[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const dirty = (Object.keys(initial) as (keyof Editorial)[]).filter(
    (key) => initial[key] !== values[key],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dirty.length === 0) return;

    setPending(true);
    setError(null);

    // Only what changed, and "" means cleared rather than "an empty string is
    // the value".
    const changes: Record<string, unknown> = {};
    for (const key of dirty) {
      const value = values[key];
      changes[key] = value === "" ? null : value;
    }

    try {
      await adminApi.updateCollection(slug, changes);
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Could not save."));
    } finally {
      setPending(false);
    }
  }

  const fieldError = (name: string) =>
    error instanceof AdminApiError ? error.fieldError(name) : undefined;

  return (
    <Panel>
      <PanelHeader
        title="Editorial metadata"
        description="Where this sequence was captured, and how it should be credited. Not part of a release, so it can be corrected at any time."
      />

      <form onSubmit={onSubmit} className="grid gap-5 p-5">
        <fieldset disabled={!editable || pending} className="grid gap-5 border-0 p-0">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Site"
              hint="Shown as the collection's title once set"
              error={fieldError("locationName")}
            >
              <input
                type="text"
                value={values.locationName}
                onChange={(event) => set("locationName", event.target.value)}
                placeholder="Kumasi"
                className="field-input"
              />
            </Field>

            <Field label="Instrument" error={fieldError("instrument")}>
              <input
                type="text"
                value={values.instrument}
                onChange={(event) => set("instrument", event.target.value)}
                placeholder="All-sky camera"
                className="field-input"
              />
            </Field>

            <Field label="Latitude" hint="Decimal degrees" error={fieldError("latitude")}>
              <input
                type="number"
                step="0.000001"
                min={-90}
                max={90}
                value={values.latitude ?? ""}
                onChange={(event) =>
                  set("latitude", event.target.value === "" ? null : Number(event.target.value))
                }
                className="field-input tabular"
              />
            </Field>

            <Field label="Longitude" hint="Decimal degrees" error={fieldError("longitude")}>
              <input
                type="number"
                step="0.000001"
                min={-180}
                max={180}
                value={values.longitude ?? ""}
                onChange={(event) =>
                  set("longitude", event.target.value === "" ? null : Number(event.target.value))
                }
                className="field-input tabular"
              />
            </Field>
          </div>

          <Field
            label="Licence"
            hint="Shown on the public page and in the download panel"
            error={fieldError("license")}
          >
            <input
              type="text"
              value={values.license}
              onChange={(event) => set("license", event.target.value)}
              placeholder="CC BY 4.0 International"
              className="field-input"
            />
          </Field>

          <Field
            label="Citation"
            hint="How this sequence should be cited. Offered with a copy button on the public page."
            error={fieldError("citation")}
          >
            <textarea
              value={values.citation}
              onChange={(event) => set("citation", event.target.value)}
              rows={3}
              className="field-input h-auto py-2.5"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="DOI" error={fieldError("doi")}>
              <input
                type="text"
                value={values.doi}
                onChange={(event) => set("doi", event.target.value)}
                placeholder="10.5281/zenodo.0000000"
                className="field-input font-mono text-[.8rem]"
              />
            </Field>

            <Field label="Methods URL" error={fieldError("methodsUrl")}>
              <input
                type="url"
                value={values.methodsUrl}
                onChange={(event) => set("methodsUrl", event.target.value)}
                className="field-input"
              />
            </Field>

            <Field label="Publication URL" error={fieldError("publicationUrl")}>
              <input
                type="url"
                value={values.publicationUrl}
                onChange={(event) => set("publicationUrl", event.target.value)}
                className="field-input"
              />
            </Field>
          </div>
        </fieldset>

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 border border-danger/40 bg-white px-3 py-2.5 text-sm leading-5 text-danger"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error.message}
          </p>
        ) : null}

        {editable ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button
              type="submit"
              className="button-primary"
              disabled={pending || dirty.length === 0}
            >
              {pending ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Saving
                </>
              ) : (
                "Save changes"
              )}
            </button>
            <p
              className={cx(
                "text-xs",
                saved ? "flex items-center gap-1.5 font-bold text-sky" : "text-muted",
              )}
              aria-live="polite"
            >
              {saved ? (
                <>
                  <Check size={14} aria-hidden="true" />
                  Saved. The public page shows this now.
                </>
              ) : dirty.length === 0 ? (
                "No unsaved changes"
              ) : (
                `${dirty.length} unsaved ${dirty.length === 1 ? "change" : "changes"}`
              )}
            </p>
          </div>
        ) : null}
      </form>
    </Panel>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs leading-5 text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
