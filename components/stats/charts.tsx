"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/*
 * The Statistics dashboard charts, drawn on the site's white cards. Hex rather
 * than var(--color-*) because these land in SVG presentation attributes; the
 * neutrals mirror the @theme tokens in app/globals.css.
 */
const PANEL = "#ffffff";
const GRID = "#dbe7ec"; // line-soft
const AXIS_TEXT = "#526879"; // muted-dim
const BLUE = "#1c6d99"; // sky
const SKY = "#0b83c9"; // sky-vivid
const CYAN = "#0891b2";
const VIOLET = "#6d5bb5";

/** Donut hues, in fixed order: a type keeps its colour however the counts rank. */
export const CLOUD_TYPE_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f59e0b",
  "#22c55e",
  "#f43f5e",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
];

const axisTick = { fill: AXIS_TEXT, fontSize: 12 };
const format = (value: number) => value.toLocaleString("en-GB");

type Count = { label: string; count: number };

/** The slice of Recharts' tooltip props this reads; its own generics fight a narrower type. */
type TooltipProps = { active?: boolean; payload?: readonly { value?: unknown; name?: unknown }[]; label?: unknown; unit: string };

function CountTooltip({ active, payload, label, unit }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value ?? 0);
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-[0_6px_18px_rgba(16,36,51,.14)]">
      <p className="font-semibold text-ink">{String(label ?? payload[0].name ?? "")}</p>
      <p className="tabular mt-0.5 text-muted">
        {format(value)} {unit}
      </p>
    </div>
  );
}

/** Columns with slanted category labels, for named categories like sites or sequences. */
export function CategoryColumns({ data, unit = "images" }: { data: Count[]; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barCategoryGap="18%">
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tick={{ ...axisTick, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} interval={0} angle={-35} textAnchor="end" height={78} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={format} allowDecimals={false} width={48} />
        <Tooltip cursor={{ fill: "#eaf4f8" }} content={(props) => <CountTooltip {...props} unit={unit} />} />
        <Bar dataKey="count" fill={BLUE} fillOpacity={0.9} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** A donut with its legend beside it (below it on narrow screens). */
export function Donut({ data, unit = "images" }: { data: Count[]; unit?: string }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-4">
      {/* flex-1 only in the row layout: in the stacked column its zero basis
          would override the height and collapse the chart to nothing. */}
      <div className="relative h-[280px] w-full max-w-[300px] shrink-0 sm:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={(props) => <CountTooltip {...props} unit={unit} />} />
            <Pie data={data} dataKey="count" nameKey="label" innerRadius="58%" outerRadius="92%" stroke={PANEL} strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
              {data.map((item, index) => (
                <Cell key={item.label} fill={CLOUD_TYPE_COLORS[index % CLOUD_TYPE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-semibold text-ink">{format(total)}</span>
          <span className="font-mono text-[.67rem] uppercase tracking-[.18em] text-muted-dim">{unit}</span>
        </div>
      </div>
      <ul className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-1">
        {data.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2 text-ink-panel">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: CLOUD_TYPE_COLORS[index % CLOUD_TYPE_COLORS.length] }} aria-hidden="true" />
            <span>{item.label}</span>
            <span className="tabular ml-auto pl-2 text-muted-dim">{total ? Math.round((item.count * 100) / total) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A smoothed line with its points marked, over an ordered axis. */
export function DottedTrend({
  data,
  unit = "images",
  tone = "sky",
  slantLabels = false,
  height = 300,
}: {
  data: Count[];
  unit?: string;
  tone?: "sky" | "cyan";
  slantLabels?: boolean;
  height?: number;
}) {
  const color = tone === "cyan" ? CYAN : SKY;
  const id = `trend-fill-${tone}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 14, bottom: 0, left: -4 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="label"
          tick={{ ...axisTick, fontSize: slantLabels ? 11 : 12 }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          interval={slantLabels ? 0 : "preserveStartEnd"}
          angle={slantLabels ? -45 : 0}
          textAnchor={slantLabels ? "end" : "middle"}
          height={slantLabels ? 56 : 30}
        />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={format} allowDecimals={false} width={56} />
        <Tooltip cursor={{ stroke: "#9fb2bd", strokeDasharray: "3 3" }} content={(props) => <CountTooltip {...props} unit={unit} />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${id})`}
          dot={{ r: 3.5, fill: color, stroke: color }}
          activeDot={{ r: 5, fill: color, stroke: PANEL, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Histogram columns over fixed bins. */
export function HistogramBars({ data, unit = "images" }: { data: Count[]; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap="12%">
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} height={30} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={format} allowDecimals={false} width={48} />
        <Tooltip cursor={{ fill: "#eaf4f8" }} content={(props) => <CountTooltip {...props} unit={unit} />} />
        <Bar dataKey="count" fill={VIOLET} fillOpacity={0.85} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
