"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  GitMerge,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Undo2,
  X,
} from "lucide-react";
import { adminApi } from "@/lib/admin/api";
import type { Vocabulary, VocabularyTerm } from "@/lib/admin/data";
import { Badge, Panel, PanelHeader, TableShell, Td, Th } from "@/components/admin/ui";

/**
 * Managing the controlled vocabularies.
 *
 * The usage count is the organising idea: it decides what a term can have
 * done to it. A term nothing uses can simply be retired; one with four
 * hundred records behind it can only be merged, because retiring it would
 * strand them. The UI shows the count first and disables what the count
 * forbids, with the reason on hover, rather than offering a button that fails.
 *
 * Reordering is by explicit up/down buttons rather than drag-and-drop. Drag
 * reordering is inaccessible without a keyboard alternative, and these lists
 * are four to a dozen items - the arrows are simply better here, not a
 * compromise.
 */
export function VocabularyManager({
  vocabularies,
  editable,
}: {
  vocabularies: Vocabulary[];
  editable: boolean;
}) {
  return (
    <div className="grid gap-6">
      {vocabularies.map((vocabulary) => (
        <VocabularyPanel key={vocabulary.kind} vocabulary={vocabulary} editable={editable} />
      ))}
    </div>
  );
}

function VocabularyPanel({
  vocabulary,
  editable,
}: {
  vocabulary: Vocabulary;
  editable: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [merging, setMerging] = useState<VocabularyTerm | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const active = vocabulary.terms.filter((term) => !term.retiredAt);
  const retired = vocabulary.terms.filter((term) => term.retiredAt);

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await action();
      router.refresh();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel as="div">
      <PanelHeader
        title={vocabulary.label}
        description={
          vocabulary.frozen
            ? "The public API validates ?season= and ?time= against these values, so the set is fixed. Terms can be reordered and renamed, but not added or removed."
            : "Open-ended: the API reports whichever of these are in use rather than validating against a fixed list."
        }
        actions={
          editable && !vocabulary.frozen && !adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="button-secondary min-h-9 text-xs"
            >
              <Plus size={14} aria-hidden="true" />
              Add term
            </button>
          ) : vocabulary.frozen ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted">
              <Lock size={13} aria-hidden="true" />
              Fixed set
            </span>
          ) : null
        }
      />

      {adding ? (
        <div className="flex flex-wrap items-end gap-3 border-b border-line bg-paper px-5 py-4">
          <label className="block">
            <span className="field-label">New term</span>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Kumasi"
              className="field-input h-10 w-64"
              autoFocus
            />
          </label>
          <button
            type="button"
            disabled={!draft.trim() || busy === "add"}
            onClick={async () => {
              const ok = await run("add", () =>
                adminApi.createVocabularyTerm(vocabulary.kind, draft.trim()),
              );
              if (ok) {
                setDraft("");
                setAdding(false);
              }
            }}
            className="button-primary min-h-10 text-xs"
          >
            {busy === "add" ? <Loader2 size={14} className="animate-spin" /> : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setDraft("");
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

      {merging ? (
        <MergePanel
          term={merging}
          candidates={active.filter((term) => term.id !== merging.id)}
          busy={busy === `merge-${merging.id}`}
          onCancel={() => {
            setMerging(null);
            setError(null);
          }}
          onConfirm={async (intoId) => {
            const ok = await run(`merge-${merging.id}`, () =>
              adminApi.mergeVocabularyTerm(merging.id, intoId),
            );
            if (ok) setMerging(null);
          }}
        />
      ) : null}

      <TableShell>
        <thead>
          <tr>
            <Th className="w-16">Order</Th>
            <Th>Term</Th>
            <Th align="right">Records</Th>
            <Th>Also known as</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {active.map((term, index) => (
            <tr key={term.id} className="hover:bg-paper">
              <Td>
                {editable ? (
                  <span className="flex gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0 || busy !== null}
                      onClick={() =>
                        run("order", () =>
                          adminApi.reorderVocabulary(
                            vocabulary.kind,
                            move(active, index, index - 1).map((entry) => entry.id),
                          ),
                        )
                      }
                      aria-label={`Move ${term.label} up`}
                      className="inline-flex size-6 items-center justify-center text-muted hover:text-sky disabled:opacity-30 disabled:hover:text-muted"
                    >
                      <ArrowUp size={13} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={index === active.length - 1 || busy !== null}
                      onClick={() =>
                        run("order", () =>
                          adminApi.reorderVocabulary(
                            vocabulary.kind,
                            move(active, index, index + 1).map((entry) => entry.id),
                          ),
                        )
                      }
                      aria-label={`Move ${term.label} down`}
                      className="inline-flex size-6 items-center justify-center text-muted hover:text-sky disabled:opacity-30 disabled:hover:text-muted"
                    >
                      <ArrowDown size={13} aria-hidden="true" />
                    </button>
                  </span>
                ) : (
                  <span className="tabular text-xs text-muted">{index + 1}</span>
                )}
              </Td>

              <Td>
                {editing === term.id ? (
                  <InlineRename
                    term={term}
                    busy={busy === `rename-${term.id}`}
                    onCancel={() => setEditing(null)}
                    onSave={async (label) => {
                      const ok = await run(`rename-${term.id}`, () =>
                        adminApi.renameVocabularyTerm(term.id, label),
                      );
                      if (ok) setEditing(null);
                    }}
                  />
                ) : (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{term.label}</span>
                    <code className="font-mono text-[.7rem] text-muted">{term.slug}</code>
                    {term.system ? (
                      <Badge tone="published" title="The public API validates against this">
                        API value
                      </Badge>
                    ) : null}
                  </span>
                )}
              </Td>

              <Td align="right" className="tabular">
                {term.records > 0 ? (
                  term.records.toLocaleString()
                ) : (
                  <span className="text-muted-dim">none</span>
                )}
              </Td>

              <Td>
                {term.aliases.length > 0 ? (
                  <span
                    className="text-xs text-muted"
                    title="Older values that still resolve to this term, so existing links keep working"
                  >
                    {term.aliases.join(", ")}
                  </span>
                ) : (
                  <span className="text-muted-dim">—</span>
                )}
              </Td>

              <Td align="right">
                {editable && editing !== term.id ? (
                  <span className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditing(term.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-sky"
                    >
                      <Pencil size={12} aria-hidden="true" />
                      Rename
                    </button>

                    {!term.system ? (
                      <button
                        type="button"
                        disabled={active.length < 2}
                        title={
                          active.length < 2
                            ? "There is nothing to merge into."
                            : "Move every record onto another term"
                        }
                        onClick={() => setMerging(term)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-sky disabled:opacity-40 disabled:hover:text-muted"
                      >
                        <GitMerge size={12} aria-hidden="true" />
                        Merge
                      </button>
                    ) : null}

                    {!term.system ? (
                      <button
                        type="button"
                        disabled={term.records > 0 || busy !== null}
                        title={
                          term.records > 0
                            ? `${term.records.toLocaleString()} records use this. Merge it into another term instead, which moves them rather than stranding them.`
                            : "Take this term out of use"
                        }
                        onClick={() => run(`retire-${term.id}`, () => adminApi.retireVocabularyTerm(term.id))}
                        className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-danger disabled:opacity-40 disabled:hover:text-muted"
                      >
                        <X size={12} aria-hidden="true" />
                        Retire
                      </button>
                    ) : null}
                  </span>
                ) : null}
              </Td>
            </tr>
          ))}

          {retired.map((term) => (
            <tr key={term.id} className="bg-paper/60">
              <Td />
              <Td>
                <span className="flex flex-wrap items-center gap-2 text-muted">
                  <span className="line-through">{term.label}</span>
                  <Badge tone="retired">
                    {term.mergedIntoId ? "merged" : "retired"}
                  </Badge>
                </span>
              </Td>
              <Td align="right" className="text-muted-dim">
                —
              </Td>
              <Td>
                <span className="text-xs text-muted-dim">
                  {term.mergedIntoId
                    ? "Its records moved; its old value still resolves"
                    : "Not in use"}
                </span>
              </Td>
              <Td align="right">
                {editable && !term.mergedIntoId ? (
                  <button
                    type="button"
                    onClick={() => run(`restore-${term.id}`, () => adminApi.restoreVocabularyTerm(term.id))}
                    className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-sky"
                  >
                    <Undo2 size={12} aria-hidden="true" />
                    Restore
                  </button>
                ) : null}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Panel>
  );
}

function InlineRename({
  term,
  busy,
  onSave,
  onCancel,
}: {
  term: VocabularyTerm;
  busy: boolean;
  onSave: (label: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(term.label);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value.trim()) onSave(value.trim());
          if (event.key === "Escape") onCancel();
        }}
        className="field-input h-9 w-56"
        autoFocus
        aria-label={`New label for ${term.label}`}
      />
      <button
        type="button"
        disabled={busy || !value.trim() || value.trim() === term.label}
        onClick={() => onSave(value.trim())}
        className="inline-flex items-center gap-1 text-xs font-bold text-sky disabled:opacity-40"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        Save
      </button>
      <button type="button" onClick={onCancel} className="text-xs font-bold text-muted">
        Cancel
      </button>
      {term.records > 0 ? (
        <span className="text-xs text-muted">
          {term.records.toLocaleString()} record
          {term.records === 1 ? "" : "s"} will follow; the old value keeps working
        </span>
      ) : null}
    </span>
  );
}

/**
 * Choosing where a term's records should go.
 *
 * The count is stated before anything happens, because "merge" is a word that
 * hides how much it moves. Nothing is deleted: the losing term is retired and
 * its old value keeps resolving to the winner.
 */
function MergePanel({
  term,
  candidates,
  busy,
  onConfirm,
  onCancel,
}: {
  term: VocabularyTerm;
  candidates: VocabularyTerm[];
  busy: boolean;
  onConfirm: (intoId: string) => void;
  onCancel: () => void;
}) {
  const [target, setTarget] = useState("");
  const winner = candidates.find((entry) => entry.id === target);

  return (
    <div className="border-b border-line bg-sky-pale px-5 py-4">
      <p className="text-sm font-bold text-sky-dark">Merge “{term.label}”</p>
      <p className="mt-1 max-w-2xl text-xs leading-5 text-sky-dark">
        {term.records > 0
          ? `${term.records.toLocaleString()} record${term.records === 1 ? "" : "s"} will move to the term you choose. `
          : "This term has no records, so nothing will move. "}
        “{term.label}” is retired rather than deleted, and keeps resolving to wherever
        its records went, so existing links do not break.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="field-label">Merge into</span>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="field-select h-10 w-64"
          >
            <option value="">Choose a term…</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label} ({candidate.records.toLocaleString()})
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={!target || busy}
          onClick={() => onConfirm(target)}
          className="button-primary min-h-10 text-xs"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : winner ? (
            `Move ${term.records.toLocaleString()} to “${winner.label}”`
          ) : (
            "Merge"
          )}
        </button>
        <button type="button" onClick={onCancel} className="button-secondary min-h-10 text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Reorder helper: move one item to a new index. */
function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
