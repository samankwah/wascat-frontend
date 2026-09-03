/**
 * The dashboard's building blocks.
 *
 * Deliberately a small hand-written set rather than a component library. The
 * dashboard should look like the archive it edits, not like someone else's
 * design system bolted onto it, and the tokens in globals.css already carry
 * the visual language.
 *
 * Everything here is a server component unless it needs state, so the
 * dashboard stays as light as the public site.
 */
import type { ReactNode } from "react";

/** Merge class names, dropping the falsy ones. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Panel({
  children,
  className,
  as: Element = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Element className={cx("border border-line bg-white", className)}>{children}</Element>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="display text-lg leading-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

const BADGE_TONES = {
  draft: "border-field bg-paper text-muted",
  published: "border-sky/30 bg-sky-pale text-sky-dark",
  retired: "border-line-strong bg-white text-muted-dim",
  measured: "border-lime bg-lime text-lime-ink",
  unmeasured: "border-dashed border-line-strong bg-white text-muted",
  danger: "border-danger/40 bg-white text-danger",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  children,
  tone = "draft",
  title,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[.65rem] font-bold uppercase tracking-[.09em]",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** A release's state, with its own vocabulary rather than a generic colour. */
export function ReleaseBadge({ status, current }: { status: string; current?: boolean }) {
  const tone: BadgeTone =
    status === "PUBLISHED" ? "published" : status === "RETIRED" ? "retired" : "draft";
  return (
    <span className="inline-flex items-center gap-2">
      <Badge tone={tone}>{status.toLowerCase()}</Badge>
      {current ? <Badge tone="measured">current</Badge> : null}
    </span>
  );
}

/**
 * Cloud cover, or an honest absence.
 *
 * The dashed outline is the whole point: an unsegmented frame has no
 * measurement, and showing "0/8" would be a clear sky nobody observed.
 */
export function CoverBadge({ oktas }: { oktas: number | null | undefined }) {
  if (oktas == null) {
    return (
      <Badge tone="unmeasured" title="No mask, so no measured cloud cover">
        unsegmented
      </Badge>
    );
  }
  const label = oktas === 0 ? "0/8 · clear" : oktas === 8 ? "8/8 · overcast" : `${oktas}/8`;
  return <Badge tone="measured">{label}</Badge>;
}

// ---------------------------------------------------------------------------
// Empty and error states
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? (
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-sky-pale text-sky">
          {icon}
        </span>
      ) : null}
      <p className="display text-xl">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Definition list, for the facts a record holds
// ---------------------------------------------------------------------------

export function Facts({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-line border-y border-line">{children}</dl>;
}

/**
 * One fact.
 *
 * When there is no value it says so in words rather than rendering an empty
 * cell: "not recorded" is information, a blank is a bug you cannot see.
 */
export function Fact({
  label,
  children,
  mono = false,
}: {
  label: string;
  children?: ReactNode;
  mono?: boolean;
}) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-bold uppercase tracking-[.09em] text-muted">{label}</dt>
      <dd className={cx("text-sm", mono && !empty && "font-mono text-[.8rem]")}>
        {empty ? <span className="text-muted-dim">Not recorded</span> : children}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function TableShell({ children }: { children: ReactNode }) {
  // Wide tables scroll inside their own container so the page body never
  // scrolls sideways.
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cx(
        "border-b border-line px-4 py-2.5 text-xs font-bold uppercase tracking-[.09em] text-muted",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cx(
        "border-b border-line px-4 py-3 align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}
