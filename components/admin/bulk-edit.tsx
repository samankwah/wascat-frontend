"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { adminApi } from "@/lib/admin/api";
import { cx } from "@/components/admin/ui";

/**
 * Applying the same provenance to many frames at once.
 *
 * A capture team supplies a site or an instrument for a whole sequence, not
 * frame by frame - and a sequence can run to thousands of frames. Editing
 * them individually is not a slower path to the same place, it is a path
 * nobody finishes.
 *
 * Two things this refuses to hide. It reports what it *could not* change, so
 * a frame in a published release is visibly skipped rather than silently
 * dropped. And tags are added by default: a bulk edit that quietly replaced
 * existing tags would be very hard to notice afterwards.
 */
export function BulkEditBar({
  selected,
  seasons,
  timesOfDay,
  onDone,
  onClear,
}: {
  selected: string[];
  seasons: string[];
  timesOfDay: string[];
  onDone: () => void;
  onClear: () => void;
}) {
  const router = useRouter();
  const [field, setField] = useState<string>("location");
  const [value, setValue] = useState("");
  const [tagMode, setTagMode] = useState<"add" | "replace" | "remove">("add");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ updated: number; skipped: number } | null>(null);

  if (selected.length === 0) return null;

  const isTags = field === "conditionTags";

  async function apply() {
    setPending(true);
    setError(null);
    setResult(null);

    const changes: Record<string, unknown> = isTags
      ? {
          conditionTags: value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }
      : { [field]: value.trim() === "" ? null : value.trim() };

    try {
      const outcome = await adminApi.bulkUpdateImages(selected, changes, tagMode);
      setResult({ updated: outcome.updated.length, skipped: outcome.skipped.length });
      setValue("");
      router.refresh();
      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not apply the change.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="sticky bottom-0 z-10 border-t border-sky bg-sky-pale px-5 py-4"
      role="region"
      aria-label="Bulk edit"
    >
      <div className="flex flex-wrap items-end gap-3">
        <p className="mr-1 text-sm font-bold text-sky-dark">
          {selected.length.toLocaleString()} selected
        </p>

        <label className="block">
          <span className="field-label">Set</span>
          <select
            value={field}
            onChange={(event) => {
              setField(event.target.value);
              setValue("");
            }}
            className="field-select h-10 w-44"
          >
            <option value="location">Site</option>
            <option value="instrument">Instrument</option>
            <option value="season">Season</option>
            <option value="timeOfDay">Time of day</option>
            <option value="conditionTags">Condition tags</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">To</span>
          {field === "season" || field === "timeOfDay" ? (
            <select
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="field-select h-10 w-52"
            >
              <option value="">Clear it</option>
              {(field === "season" ? seasons : timesOfDay).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={isTags ? "hazy, dusty" : "Leave empty to clear"}
              className="field-input h-10 w-52"
            />
          )}
        </label>

        {isTags ? (
          <label className="block">
            <span className="field-label">How</span>
            <select
              value={tagMode}
              onChange={(event) =>
                setTagMode(event.target.value as "add" | "replace" | "remove")
              }
              className="field-select h-10 w-36"
            >
              <option value="add">Add to existing</option>
              <option value="replace">Replace all</option>
              <option value="remove">Remove these</option>
            </select>
          </label>
        ) : null}

        <button
          type="button"
          onClick={apply}
          disabled={pending || (isTags && !value.trim())}
          className="button-primary min-h-10 text-xs"
        >
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Applying
            </>
          ) : (
            `Apply to ${selected.length.toLocaleString()}`
          )}
        </button>

        <button type="button" onClick={onClear} className="button-secondary min-h-10 text-xs">
          <X size={13} aria-hidden="true" />
          Clear selection
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm leading-5 text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {result ? (
        <p
          className={cx(
            "mt-3 flex items-start gap-2 text-sm leading-5",
            result.skipped > 0 ? "text-sky-dark" : "text-sky-dark",
          )}
          aria-live="polite"
        >
          <Check size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {result.updated.toLocaleString()} updated.
          {result.skipped > 0
            ? ` ${result.skipped.toLocaleString()} skipped — those belong to a published release, which is immutable.`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
