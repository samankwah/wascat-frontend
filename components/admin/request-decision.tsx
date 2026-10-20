"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Check, Loader2, Mail } from "lucide-react";
import { AdminApiError, adminApi } from "@/lib/admin/api";
import type { DataRequest } from "@/lib/admin/data";
import { Panel, PanelHeader, cx } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

const ACCESS_DAYS = [3, 7, 14, 30];

/**
 * Approve or decline a request, or - once decided - send the outcome again.
 *
 * A decision is final, so declining asks once more before it goes, and both
 * say plainly what the requester will receive. Approving needs no note;
 * declining always does, because the requester deserves a reason.
 */
export function RequestDecision({ request, defaultDays = 7 }: { request: DataRequest; defaultDays?: number }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [days, setDays] = useState(defaultDays);
  const [pending, setPending] = useState<"approve" | "decline" | "resend" | null>(null);
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run(kind: "approve" | "decline" | "resend") {
    setError(null);
    setDone(null);
    if (kind === "decline" && note.trim().length < 5) {
      setError("Write the reason the requester will be sent (at least a few words).");
      return;
    }
    setPending(kind);
    try {
      const result =
        kind === "approve"
          ? await adminApi.approveDataRequest(request.id, note.trim() || undefined, days)
          : kind === "decline"
            ? await adminApi.declineDataRequest(request.id, note.trim())
            : await adminApi.resendDataRequest(request.id);
      // Say what happened to the email, not what was meant to happen.
      if (result.lastMailError) {
        setError(
          `${kind === "approve" ? "Approved" : kind === "decline" ? "Declined" : "Not sent"}, but the email to ${request.email} did not go: ${result.lastMailError}. Use Resend email once mail is working.`,
        );
      } else {
        setDone(
          kind === "resend"
            ? `Sent again to ${request.email}.`
            : kind === "approve"
              ? `Approved. ${request.email} has been sent a private download link.`
              : `Declined. ${request.email} has been sent your reason.`,
        );
      }
      setConfirmingDecline(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AdminApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setPending(null);
    }
  }

  if (request.status !== "PENDING") {
    const approved = request.status === "APPROVED";
    return (
      <Panel>
        <PanelHeader
          title={approved ? "Approved" : "Declined"}
          description={
            approved
              ? `${request.requesterNotifiedAt ? "The requester was sent" : "The requester is to be sent"} a private download link${request.accessExpiresAt ? ` that works until ${formatDate(request.accessExpiresAt, true)}` : ""}.`
              : request.requesterNotifiedAt
                ? "The requester was sent the reason below."
                : "The requester is to be sent the reason below."
          }
        />
        <div className="grid gap-4 p-5">
          {request.decisionNote ? (
            <div className="rounded-lg bg-paper px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-dim">{approved ? "Note sent with the data" : "Reason sent"}</p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-ink">{request.decisionNote}</p>
            </div>
          ) : null}
          <p className="text-sm text-muted">
            {request.requesterNotifiedAt
              ? `Emailed ${formatDate(request.requesterNotifiedAt, true)}.`
              : "The requester has not been emailed yet."}
          </p>
          {request.lastMailError && !error ? (
            <p role="alert" className="flex items-start gap-2 border border-danger/40 bg-white px-3 py-2.5 text-sm leading-5 text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              The last email failed: {request.lastMailError}
            </p>
          ) : null}
          <Feedback error={error} done={done} />
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button type="button" className="button-secondary" onClick={() => run("resend")} disabled={pending !== null}>
              {pending === "resend" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Mail size={15} aria-hidden="true" />}
              Resend email
            </button>
            <p className="text-xs leading-5 text-muted">
              {approved ? "Sends a new link, valid for the default period; the old link stops working." : "Sends the same reason again."}
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader title="Decision" description="Approving emails the requester a private download link. Declining emails them the reason you give." />
      <div className="grid gap-5 p-5">
        <label className="block">
          <span className="field-label">Note to the requester</span>
          <textarea
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setError(null);
            }}
            rows={4}
            className="field-input"
            placeholder="Optional when approving. Required when declining: the reason they will be sent."
          />
        </label>

        <label className="block max-w-xs">
          <span className="field-label">Download link works for</span>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="field-select">
            {ACCESS_DAYS.map((value) => (
              <option key={value} value={value}>
                {value} days
              </option>
            ))}
          </select>
        </label>

        <Feedback error={error} done={done} />

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <button type="button" className="button-primary" onClick={() => run("approve")} disabled={pending !== null}>
            {pending === "approve" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
            Approve and send link
          </button>

          {confirmingDecline ? (
            <span className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={cx("button-secondary border-danger/50 text-danger hover:border-danger")}
                onClick={() => run("decline")}
                disabled={pending !== null}
              >
                {pending === "decline" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                Yes, decline
              </button>
              <button type="button" className="text-sm font-semibold text-muted hover:text-ink" onClick={() => setConfirmingDecline(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                if (note.trim().length < 5) {
                  setError("Write the reason the requester will be sent before declining.");
                  return;
                }
                setConfirmingDecline(true);
              }}
              disabled={pending !== null}
            >
              Decline…
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Feedback({ error, done }: { error: string | null; done: string | null }) {
  if (error)
    return (
      <p role="alert" className="flex items-start gap-2 border border-danger/40 bg-white px-3 py-2.5 text-sm leading-5 text-danger">
        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        {error}
      </p>
    );
  if (done)
    return (
      <p role="status" className="flex items-center gap-2 text-sm font-bold text-sky">
        <Check size={15} aria-hidden="true" />
        {done}
      </p>
    );
  return null;
}
