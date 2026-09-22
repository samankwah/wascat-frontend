"use client";

import { useState } from "react";
import { Cloud } from "lucide-react";
import type { ImageRecord } from "@/lib/types";

/**
 * What a classifier said about this frame, in full.
 *
 * Every class the model scored is listed, ranked, with its probability - not
 * just the winner. An all-sky frame routinely holds several genera at once, so
 * a single label would throw away most of what the model said and most of what
 * makes it checkable: a reader comparing the model against the observer's own
 * reading needs the runners-up to do it.
 *
 * Where more than one model has scored the frame, a select switches between
 * them. With one model there is nothing to choose, so the control is replaced
 * by the model's name rather than rendered as a dropdown with one option.
 */
export function PredictionPanel({ record }: { record: ImageRecord }) {
  const predictions = record.predictions ?? [];
  const [slug, setSlug] = useState(predictions[0]?.model.slug ?? "");
  const selected = predictions.find((item) => item.model.slug === slug) ?? predictions[0];

  if (!selected) {
    return (
      <section className="mt-9 border-t border-white/20 pt-7">
        <p className="eyebrow text-sky-light">Model classification</p>
        <p className="mt-3 text-sm leading-6 text-white/60">
          No model has classified this frame yet. When one has, every cloud type it scored appears
          here with its probability — the archive stores the whole distribution, not a single
          winning label.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-9 border-t border-white/20 pt-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-sky-light">Model classification</p>
          <p className="mt-2 text-xs leading-5 text-white/60">
            Probability across every cloud type the model scored.
          </p>
        </div>

        {predictions.length > 1 ? (
          <label className="sm:min-w-64">
            <span className="field-label text-white/45">Model</span>
            <select
              value={selected.model.slug}
              onChange={(event) => setSlug(event.target.value)}
              className="h-11 w-full border border-white/25 bg-ink-abyss px-3 text-sm text-white hover:border-white/45 focus-visible:border-sky-light"
            >
              {predictions.map((item) => (
                <option key={item.model.slug} value={item.model.slug} className="text-ink">
                  {item.model.name} · {item.model.version}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-xs text-white/60">
            <span className="font-bold text-white">{selected.model.name}</span>{" "}
            <span className="font-mono">{selected.model.version}</span>
          </p>
        )}
      </div>

      <ol className="mt-6 grid gap-px">
        {selected.classes.map((entry, index) => {
          const percent = entry.probability * 100;
          // The observer's own reading of this frame, when there is one. Worth
          // marking rather than asserting: the model agreeing with the observer
          // is a different fact from the model being right.
          const observed = entry.skyClass === record.skyClass;
          return (
            <li
              key={entry.skyClass}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-white/10 py-3"
            >
              <span
                className={`flex min-w-0 items-center gap-2 text-sm ${index === 0 ? "font-bold text-white" : "text-white/70"}`}
              >
                <span className="truncate">{entry.skyClass}</span>
                {observed && (
                  <span
                    className="shrink-0 border border-lime/60 px-1.5 py-0.5 text-[.55rem] font-bold uppercase tracking-wider text-lime"
                    title="This is also the cloud type the observer recorded"
                  >
                    Observed
                  </span>
                )}
              </span>
              <span
                className={`tabular font-mono text-sm ${index === 0 ? "text-white" : "text-white/70"}`}
              >
                {percent.toFixed(1)}%
              </span>
              {/* Full width under the row, so the bars share one baseline and
                  read as a distribution rather than as five separate meters. */}
              <span
                className="col-span-2 block h-1 bg-white/10"
                role="img"
                aria-label={`${entry.skyClass}: ${percent.toFixed(1)} percent`}
              >
                <span
                  className={`block h-full ${index === 0 ? "bg-lime" : "bg-sky-light/60"}`}
                  style={{ width: `${Math.max(percent, 0.4)}%` }}
                />
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 flex gap-2 text-xs leading-5 text-white/55">
        <Cloud size={15} className="mt-0.5 shrink-0 text-sky-light" aria-hidden="true" />
        <span>
          These are a model&apos;s probabilities, not a measurement. The archive records what the
          model said; the cloud type and cover an observer recorded are listed separately, and the
          two are never reconciled.
        </span>
      </p>
    </section>
  );
}
