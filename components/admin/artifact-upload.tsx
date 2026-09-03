"use client";

import { useRouter } from "next/navigation";
import { useCallback, useId, useState, type DragEvent } from "react";
import {
  AlertCircle,
  Check,
  FileImage,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminApiError } from "@/lib/admin/api";
import { Panel, PanelHeader, cx } from "@/components/admin/ui";

type SlotName = "source" | "mask";

type Status = "idle" | "checking" | "uploading" | "done" | "failed";

type Attempt = {
  file: File;
  status: Status;
  /** What went wrong, in words a curator can act on. */
  error?: string;
  result?: { bytes: number; width: number; height: number; measurementCleared: boolean };
};

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Attaching a frame or a mask to a record.
 *
 * Two drop targets rather than one, because the two files are not
 * interchangeable: a frame is what the camera saw and a mask is what was
 * segmented from it, and dropping one where the other belongs would be a
 * quiet, consequential mistake. Naming the slot makes that impossible.
 *
 * Validation happens twice on purpose. The browser checks type and dimensions
 * so an obvious mistake is caught before a megabyte crosses the network, and
 * the server checks everything again because a client-side check is a
 * convenience, never a guarantee.
 */
export function ArtifactUpload({
  recordId,
  editable,
  expected,
  present,
}: {
  recordId: string;
  editable: boolean;
  /** The record's dimensions. A mask that does not match these is refused. */
  expected: { width: number; height: number };
  present: { source: boolean; mask: boolean };
}) {
  return (
    <Panel>
      <PanelHeader
        title="Imagery"
        description={
          editable
            ? `Both files must be exactly ${expected.width}×${expected.height}. A mask that does not line up with its frame makes the measured cloud cover meaningless.`
            : "This record belongs to a published release, so its imagery is fixed."
        }
      />
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <ArtifactSlot
          recordId={recordId}
          slot="source"
          label="Source frame"
          hint="What the all-sky camera saw"
          editable={editable}
          expected={expected}
          hasFile={present.source}
          canRemove={present.source && present.mask}
        />
        <ArtifactSlot
          recordId={recordId}
          slot="mask"
          label="Segmentation mask"
          hint="Binary mask; white is cloud"
          editable={editable}
          expected={expected}
          hasFile={present.mask}
          canRemove={present.mask && present.source}
        />
      </div>
    </Panel>
  );
}

function ArtifactSlot({
  recordId,
  slot,
  label,
  hint,
  editable,
  expected,
  hasFile,
  canRemove,
}: {
  recordId: string;
  slot: SlotName;
  label: string;
  hint: string;
  editable: boolean;
  expected: { width: number; height: number };
  hasFile: boolean;
  canRemove: boolean;
}) {
  const router = useRouter();
  const inputId = useId();
  const [over, setOver] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [removing, setRemoving] = useState(false);

  /**
   * Measure the image in the browser before sending it.
   *
   * The server checks this too. Doing it here as well means a wrong-sized
   * file is refused instantly and locally, rather than after an upload that
   * was always going to be rejected.
   */
  const measure = (file: File) =>
    new Promise<{ width: number; height: number } | null>((resolve) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      image.src = url;
    });

  const send = useCallback(
    async (file: File) => {
      setAttempt({ file, status: "checking" });

      if (!ACCEPT.split(",").includes(file.type)) {
        setAttempt({
          file,
          status: "failed",
          error: "The archive stores JPEG, PNG and WebP images.",
        });
        return;
      }

      const size = await measure(file);
      if (!size) {
        setAttempt({ file, status: "failed", error: "That file could not be read as an image." });
        return;
      }
      if (size.width !== expected.width || size.height !== expected.height) {
        setAttempt({
          file,
          status: "failed",
          error: `That image is ${size.width}×${size.height}. This record is ${expected.width}×${expected.height}.`,
        });
        return;
      }

      setAttempt({ file, status: "uploading" });

      const body = new FormData();
      body.append("file", file);

      try {
        const csrf = document.cookie.match(/(?:^|; )wascat_csrf=([^;]*)/);
        const response = await fetch(
          `/api/v1/admin/images/${encodeURIComponent(recordId)}/artifacts/${slot}`,
          {
            method: "PUT",
            body,
            headers: csrf ? { "X-CSRF-Token": decodeURIComponent(csrf[1]) } : {},
            credentials: "same-origin",
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          throw new AdminApiError(
            response.status,
            "upload_failed",
            payload?.error?.message ?? `Upload failed (${response.status}).`,
          );
        }

        const payload = (await response.json()) as {
          data: { bytes: number; width: number; height: number; measurementCleared: boolean };
        };
        setAttempt({ file, status: "done", result: payload.data });
        router.refresh();
      } catch (caught) {
        setAttempt({
          file,
          status: "failed",
          error: caught instanceof Error ? caught.message : "Upload failed.",
        });
      }
    },
    [expected.height, expected.width, recordId, router, slot],
  );

  async function remove() {
    if (!window.confirm(`Remove the ${label.toLowerCase()} from ${recordId}?`)) return;
    setRemoving(true);
    try {
      const csrf = document.cookie.match(/(?:^|; )wascat_csrf=([^;]*)/);
      const response = await fetch(
        `/api/v1/admin/images/${encodeURIComponent(recordId)}/artifacts/${slot}`,
        {
          method: "DELETE",
          headers: csrf ? { "X-CSRF-Token": decodeURIComponent(csrf[1]) } : {},
          credentials: "same-origin",
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setAttempt({
          file: new File([], ""),
          status: "failed",
          error: payload?.error?.message ?? "Could not remove the file.",
        });
        return;
      }
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    if (!editable) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void send(file);
  }

  const busy = attempt?.status === "uploading" || attempt?.status === "checking";

  return (
    <div>
      <p className="field-label">{label}</p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (editable) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cx(
          "relative flex min-h-[9.5rem] flex-col items-center justify-center border border-dashed px-4 py-6 text-center transition-colors",
          !editable && "border-line bg-paper",
          editable && !over && "border-field bg-white hover:border-sky hover:bg-sky-pale/40",
          editable && over && "border-sky bg-sky-pale",
        )}
      >
        {/* The input is the control; the panel is a convenience on top of it.
            That way keyboard and screen-reader users get a real file picker
            rather than a div nobody can reach. */}
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={!editable || busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void send(file);
            // Reset, so choosing the same file twice still fires a change.
            event.target.value = "";
          }}
        />

        {busy ? (
          <>
            <Loader2 size={20} className="animate-spin text-sky" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium" aria-live="polite">
              {attempt?.status === "checking" ? "Checking the image" : "Uploading"}
            </p>
            <p className="mt-1 max-w-full truncate text-xs text-muted">{attempt?.file.name}</p>
          </>
        ) : attempt?.status === "done" ? (
          <>
            <Check size={20} className="text-sky" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium" aria-live="polite">
              Stored
            </p>
            <p className="mt-1 text-xs text-muted">
              {attempt.result!.width}×{attempt.result!.height} ·{" "}
              {(attempt.result!.bytes / 1024).toFixed(0)} KB
            </p>
            <button
              type="button"
              onClick={() => setAttempt(null)}
              className="mt-3 text-xs font-bold text-sky hover:underline"
            >
              Replace again
            </button>
          </>
        ) : attempt?.status === "failed" ? (
          <>
            <AlertCircle size={20} className="text-danger" aria-hidden="true" />
            <p
              className="mt-2 max-w-[22rem] text-sm leading-5 text-danger"
              role="alert"
            >
              {attempt.error}
            </p>
            <button
              type="button"
              onClick={() => setAttempt(null)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky hover:underline"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Try another file
            </button>
          </>
        ) : (
          <>
            <FileImage
              size={22}
              className={cx(editable ? "text-line-strong" : "text-line")}
              aria-hidden="true"
            />
            <p className="mt-2 text-sm">
              {hasFile ? (
                <span className="font-medium">Already attached</span>
              ) : (
                <span className="text-muted">Nothing attached</span>
              )}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>

            {editable ? (
              <label
                htmlFor={inputId}
                className="button-secondary mt-3 min-h-9 cursor-pointer text-xs"
              >
                <Upload size={13} aria-hidden="true" />
                {hasFile ? "Replace" : "Choose a file"}
              </label>
            ) : null}

            {editable ? (
              <p className="mt-2 text-[.68rem] text-muted-dim">or drop a file here</p>
            ) : null}
          </>
        )}
      </div>

      {attempt?.status === "done" && attempt.result?.measurementCleared ? (
        <p className="mt-2 flex items-start gap-1.5 border border-line bg-sky-pale px-3 py-2 text-xs leading-5 text-sky-dark">
          <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          The cloud cover measured from the previous mask no longer describes this file, so
          it has been cleared. Re-run the pipeline to measure the new one.
        </p>
      ) : null}

      {editable && hasFile ? (
        <button
          type="button"
          onClick={remove}
          disabled={removing || !canRemove}
          title={
            canRemove
              ? undefined
              : "A record must keep at least one of its frame or mask. Retire the record instead."
          }
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted"
        >
          {removing ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={13} aria-hidden="true" />
          )}
          Remove
        </button>
      ) : null}
    </div>
  );
}
