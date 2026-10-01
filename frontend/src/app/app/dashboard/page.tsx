"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  ChartPie,
  FileText,
  Filter,
  Handshake,
  Minus,
  Package,
  PawPrint,
  Receipt,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Syringe,
  Trophy,
  TrendingUp,
  UserPlus,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboard, type DashboardData, type Delta } from "@/lib/use-dashboard";
import { useCountUp } from "@/lib/use-count-up";
import { isBasePlan } from "@/lib/plan";

const TONE = {
  green: "#0e8f5c",
  amber: "#b9770e",
  red: "#c23b2b",
  indigo: "#4f46e5",
  slate: "#64748b",
  violet: "#7c3aed",
  sky: "#0284c7",
  wine: "#a3175a",
};
const CATEGORICAL = [TONE.indigo, TONE.sky, TONE.green, TONE.amber, TONE.violet, TONE.wine, TONE.slate];
const STAGE_META: Record<string, { label: string; color: string }> = {
  prospecting: { label: "Prospeccion", color: TONE.slate },
  qualification: { label: "Calificacion", color: TONE.sky },
  proposal: { label: "Propuesta", color: TONE.violet },
  negotiation: { label: "Negociacion", color: TONE.amber },
  won: { label: "Ganado", color: TONE.green },
  lost: { label: "Perdido", color: TONE.red },
};
const FUNNEL_STAGES = ["prospecting", "qualification", "proposal", "negotiation", "won"];

function monthShort(ym: string) {
  return new Date(`${ym}-01T00:00:00`).toLocaleDateString("es-CO", { month: "short" }).replace(".", "");
}
function fmt(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}
function money(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}
function timeAgo(from: Date | undefined, nowMs: number) {
  if (!from) return "";
  const s = Math.max(0, Math.round((nowMs - from.getTime()) / 1000));
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  return `hace ${Math.round(s / 3600)} h`;
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function IconBadge({ tone, size = 10, children }: { tone: string; size?: 9 | 10 | 11; children: React.ReactNode }) {
  const cls = size === 9 ? "size-9" : size === 11 ? "size-11" : "size-10";
  return (
    <span
      className={`grid ${cls} shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-current/15`}
      style={{ backgroundColor: `${tone}1f`, color: tone }}
    >
      {children}
    </span>
  );
}

function DeltaChip({ delta, unit = "%" }: { delta: Delta; unit?: string }) {
  if (delta.pct === null) return null;
  const up = delta.pct > 0;
  const flat = delta.pct === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const color = flat ? "text-muted-foreground" : up ? "text-success" : "text-destructive";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="size-3.5" />
      {up ? "+" : ""}
      {delta.pct}
      {unit}
    </span>
  );
}

function AnimatedValue({ value, suffix = "" }: { value: number; suffix?: string }) {
  const v = useCountUp(value);
  return (
    <span className="tabular-nums">
      {fmt(v)}
      {suffix}
    </span>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
  delta,
  hint,
  emphasis,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  tone: string;
  delta?: Delta;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-border/70 ${
        emphasis ? "ring-1 ring-primary/25 shadow-[0_0_0_1px_rgba(99,102,241,0.06),0_8px_30px_-12px_rgba(99,102,241,0.25)]" : ""
      }`}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-0.75 rounded-t-lg" style={{ backgroundColor: tone }} />
      {emphasis ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-20 blur-2xl"
          style={{ backgroundColor: tone }}
        />
      ) : null}
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-1.5 font-semibold ${emphasis ? "text-3xl" : "text-2xl"}`}>
            <AnimatedValue value={value} suffix={suffix} />
          </p>
          <div className="mt-1 flex items-center gap-2">
            {delta ? <DeltaChip delta={delta} /> : null}
            {hint ? <span className="truncate text-xs text-muted-foreground">{hint}</span> : null}
          </div>
        </div>
        <IconBadge tone={tone} size={emphasis ? 11 : 10}>
          <Icon className="size-5" />
        </IconBadge>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-3 p-3.5">
        <IconBadge tone={tone} size={9}>
          <Icon className="size-4" />
        </IconBadge>
        <div className="min-w-0">
          <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{fmt(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</h2>;
}

function ChartFrame({
  title,
  description,
  icon: Icon,
  tone,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  tone: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-border/70 ${className}`}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <IconBadge tone={tone} size={9}>
              <Icon className="size-4" />
            </IconBadge>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

type TipRow = { name?: string; value?: number | string; color?: string };
function ChartTip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: TipRow[];
  label?: string | number;
  format?: (v: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label != null && <p className="mb-1 font-medium">{format ? format(String(label)) : label}</p>}
      {payload.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
          <span className="text-muted-foreground">{row.name}</span>
          <span className="ml-auto font-semibold tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{label}</div>;
}

/* ---------------- charts ---------------- */

function RevenueTrend({ data }: { data: DashboardData["trends"]["revenue_monthly"] }) {
  const rows = data.map((d) => ({ ...d, label: monthShort(d.month) }));
  if (rows.every((d) => d.revenue === 0)) return <EmptyChart label="Sin ingresos registrados." />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TONE.indigo} stopOpacity={0.35} />
              <stop offset="100%" stopColor={TONE.indigo} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v) => money(v)}
          />
          <Tooltip content={<ChartTip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Ingresos"
            stroke={TONE.indigo}
            strokeWidth={2}
            fill="url(#revenue-fill)"
            dot={{ r: 2.5, strokeWidth: 0, fill: TONE.indigo }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type DonutLabelProps = { cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; value?: number; percent?: number };
function renderDonutLabel(props: DonutLabelProps) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, value = 0, percent = 0 } = props;
  const pct = Math.round(percent * 100);
  if (pct < 6) return null; // slice too thin - text would overflow it
  const RADIAN = Math.PI / 180;
  const r = (innerRadius + outerRadius) / 2;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <g>
      <text x={x} y={y - 6} textAnchor="middle" dominantBaseline="middle" className="fill-white text-[11px] font-bold">
        {pct}%
      </text>
      <text x={x} y={y + 7} textAnchor="middle" dominantBaseline="middle" className="fill-white/75 text-[9px]">
        {value}
      </text>
    </g>
  );
}

function DonutStages({ rows }: { rows: DashboardData["deals_by_stage"] }) {
  const data = rows
    .filter((r) => r.total > 0)
    .map((r) => ({ name: STAGE_META[r.stage]?.label ?? r.stage, value: r.total, color: STAGE_META[r.stage]?.color ?? TONE.slate }));
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart label="Sin deals registrados." />;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={3}
              strokeWidth={2}
              style={{ stroke: "var(--card)" }}
              label={renderDonutLabel}
              labelLine={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm sm:min-w-0 sm:flex-1">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.name}</span>
            <span className="shrink-0 font-medium tabular-nums">{d.value}</span>
            <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PipelineFunnel({ rows }: { rows: DashboardData["deals_by_stage"] }) {
  const byStage = new Map(rows.map((r) => [r.stage, r.total]));
  const stages = FUNNEL_STAGES.map((stage) => ({ stage, count: byStage.get(stage) ?? 0 }));
  const top = stages[0]?.count || 1;
  return (
    <div className="space-y-4">
      {stages.map((s, i) => {
        const prev = i === 0 ? null : stages[i - 1].count;
        const conv = prev && prev > 0 ? Math.round((s.count / prev) * 100) : null;
        return (
          <div key={s.stage} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-muted-foreground sm:w-36">{STAGE_META[s.stage]?.label ?? s.stage}</span>
            <div className="h-9 flex-1 overflow-hidden rounded-lg bg-muted">
              <div
                className="flex h-full items-center rounded-lg pl-3 text-xs font-semibold text-white/90 transition-[width]"
                style={{ width: `${Math.max(12, (s.count / top) * 100)}%`, backgroundColor: CATEGORICAL[i % CATEGORICAL.length] }}
              >
                {s.count}
              </div>
            </div>
            <span
              className="w-16 shrink-0 text-right text-xs tabular-nums"
              style={{ color: conv !== null && conv < 100 ? TONE.amber : "var(--muted-foreground)" }}
              title={conv !== null ? `${conv}% pasa de la etapa anterior` : undefined}
            >
              {conv !== null ? `${conv}%` : ""}
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-muted-foreground">
        Conversion total:{" "}
        <span className="font-medium text-foreground">{top > 0 ? Math.round(((stages.at(-1)?.count ?? 0) / top) * 100) : 0}%</span>{" "}
        de las oportunidades llega a ganado.
      </p>
    </div>
  );
}

function DealsWonLost({ data }: { data: DashboardData["trends"]["deals_monthly"] }) {
  const rows = data.map((d) => ({ ...d, label: monthShort(d.month) }));
  return (
    <>
      <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: TONE.green }} /> Ganados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: TONE.red }} /> Perdidos
        </span>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis allowDecimals={false} width={24} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTip />} />
            <Bar dataKey="won" name="Ganados" fill={TONE.green} radius={[3, 3, 0, 0]} maxBarSize={16} />
            <Bar dataKey="lost" name="Perdidos" fill={TONE.red} radius={[3, 3, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function TopProductsBars({ rows }: { rows: DashboardData["top_products"] }) {
  if (rows.length === 0) return <EmptyChart label="Sin productos." />;
  const data = rows.map((r, i) => ({ ...r, fill: CATEGORICAL[i % CATEGORICAL.length] }));
  return (
    <div style={{ height: Math.max(140, data.length * 44) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTip />} />
          <Bar dataKey="stock_on_hand" name="Existencia" radius={[0, 5, 5, 0]} maxBarSize={26}>
            {data.map((r) => (
              <Cell key={r.name} fill={r.fill} />
            ))}
            <LabelList dataKey="stock_on_hand" position="right" className="fill-foreground" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- activity + secondary ---------------- */

const ACTIVITY_META: { match: string; icon: LucideIcon; tone: string }[] = [
  { match: "login", icon: ShieldCheck, tone: TONE.slate },
  { match: "client", icon: Users, tone: TONE.indigo },
  { match: "deal", icon: Handshake, tone: TONE.violet },
  { match: "order", icon: Receipt, tone: TONE.green },
  { match: "purchase_order", icon: ShoppingCart, tone: TONE.sky },
  { match: "product", icon: Package, tone: TONE.amber },
  { match: "user", icon: UserPlus, tone: TONE.indigo },
  { match: "role", icon: ShieldCheck, tone: TONE.wine },
];
function activityMeta(action: string) {
  return ACTIVITY_META.find((m) => action.toLowerCase().includes(m.match)) ?? { icon: Receipt, tone: TONE.slate };
}
function humanize(action: string) {
  const t = action.replace(/[._]/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function ActivityTimeline({ items }: { items: DashboardData["recent_activity"] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>;
  return (
    <ol className="relative space-y-4 before:absolute before:left-3.75 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
      {items.map((it) => {
        const meta = activityMeta(it.action);
        const Icon = meta.icon;
        return (
          <li key={it.id} className="relative flex gap-3">
            <span
              className="z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-card"
              style={{ backgroundColor: `${meta.tone}22`, color: meta.tone }}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{humanize(it.action)}</p>
              <p className="text-xs text-muted-foreground">
                {it.user ?? "Sistema"}
                {it.module ? ` · ${it.module}` : ""} ·{" "}
                {new Date(it.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LowStockList({ products }: { products: DashboardData["low_stock_alerts"] }) {
  if (!products.length) return <p className="text-sm text-muted-foreground">Ningun producto por debajo de su punto de reorden.</p>;
  return (
    <ul className="space-y-3">
      {products.map((p) => (
        <li key={p.id} className="flex items-center gap-3">
          <IconBadge tone={TONE.red} size={9}>
            <Boxes className="size-4" />
          </IconBadge>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">SKU {p.sku} · reorden en {p.reorder_level}</p>
          </div>
          <StatusBadge status="overdue" label="Stock crítico" className="ml-auto shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/* ---------------- states ---------------- */

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-lg border border-border bg-card lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function DashboardPage() {
  const { data, loading, error, fetchedAt, refresh } = useDashboard();
  const [nowMs, setNowMs] = React.useState(() => Date.now());
  const reduce = useReducedMotion();

  // Mantiene "hace Xs" al dia sin leer el reloj en cada render.
  React.useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  void nowMs;

  if (loading && !data) return <LoadingState />;
  if (error && !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={refresh} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">
          <RefreshCw className="size-4" /> Reintentar
        </button>
      </div>
    );
  }
  if (!data) return <LoadingState />;

  const m = data.metrics;
  const stageCount = (stage: string) => data.deals_by_stage.find((s) => s.stage === stage)?.total ?? 0;

  // Plan base: se ocultan las tarjetas y gráficos de los módulos que no incluye
  // (deals, órdenes de compra, alertas de stock, actividad/auditoría). Ver docs/plan-base.md.
  const base = isBasePlan();

  return (
    <motion.div
      variants={reduce ? undefined : container}
      initial={reduce ? undefined : "hidden"}
      animate={reduce ? undefined : "show"}
      className="space-y-7"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vista general de la clínica: agenda, pacientes e inventario.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </button>
          <span className="hidden text-xs text-muted-foreground sm:inline">Actualizado {timeAgo(fetchedAt, nowMs)}</span>
        </div>
      </motion.div>

      {/* Clínica */}
      {data.clinical ? (
        <motion.div variants={item}>
          <SectionLabel>Clínica</SectionLabel>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Citas hoy" value={data.clinical.appointments_today} icon={CalendarClock} tone={TONE.indigo} />
            <MiniStat label="Pacientes activos" value={data.clinical.active_patients} icon={PawPrint} tone={TONE.green} />
            <MiniStat label="Vacunas por vencer" value={data.clinical.vaccinations_due} icon={Syringe} tone={TONE.amber} />
            <MiniStat label="Consultas del mes" value={data.clinical.consultations_month} icon={Stethoscope} tone={TONE.violet} />
          </div>
        </motion.div>
      ) : null}

      {/* ERP Pyme V1: Finanzas, Ventas y Compras */}
      <motion.div variants={item}>
        <SectionLabel>Finanzas y Operación ERP</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Ventas del mes (Facturación)"
            value={m.sales_month ?? m.revenue_month ?? 0}
            icon={TrendingUp}
            tone={TONE.indigo}
            hint="Total emitido en facturas"
          />
          <KpiCard
            label="Compras del mes"
            value={m.purchases_month ?? 0}
            icon={ShoppingCart}
            tone={TONE.sky}
            hint="Recepciones confirmadas"
          />
          <KpiCard
            label="Cuentas por cobrar (Cartera)"
            value={m.accounts_receivable ?? 0}
            icon={Receipt}
            tone={TONE.green}
            hint={m.overdue_receivables ? `Vencida: $${Math.round(m.overdue_receivables).toLocaleString("es-CO")}` : "Al día"}
          />
          <KpiCard
            label="Cuentas por pagar"
            value={m.accounts_payable ?? 0}
            icon={FileText}
            tone={TONE.amber}
            hint="Obligaciones con proveedores"
          />
        </div>
      </motion.div>

      {/* KPI hero */}
      <motion.div variants={item}>
        <div className={`grid gap-3 sm:grid-cols-2 ${base ? "lg:grid-cols-2" : "lg:grid-cols-4"}`}>
          <KpiCard
            label="Ingresos pedidos mostrador"
            value={m.revenue_month ?? 0}
            icon={TrendingUp}
            tone={TONE.indigo}
            delta={data.deltas.revenue}
          />
          <KpiCard label="Clientes registrados" value={m.total_clients ?? 0} icon={Users} tone={TONE.green} />
          <KpiCard
            label="Caja (Saldo esperado sesión)"
            value={m.cash_open_expected ?? 0}
            icon={Warehouse}
            tone={TONE.violet}
            hint="Sesiones abiertas activas"
          />
          <KpiCard
            label="Alertas de stock bajo"
            value={m.low_stock_products ?? 0}
            icon={Boxes}
            tone={TONE.red}
            hint="Productos bajo punto reorden"
          />
        </div>
      </motion.div>

      {/* Second metrics: pipeline por etapa (deals) */}
      {!base && (
        <motion.div variants={item}>
          <SectionLabel>Pipeline por etapa</SectionLabel>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(STAGE_META).map(([stage, meta]) => (
              <MiniStat key={stage} label={meta.label} value={stageCount(stage)} icon={Handshake} tone={meta.color} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Analytics */}
      <motion.div variants={item}>
        <SectionLabel>Analitica</SectionLabel>
        <div className={`grid gap-4 ${base ? "" : "lg:grid-cols-3"}`}>
          <ChartFrame
            className={base ? "" : "lg:col-span-2"}
            title="Ingresos"
            description="Ingresos mensuales por pedidos confirmados — ultimos 12 meses."
            icon={TrendingUp}
            tone={TONE.indigo}
          >
            <RevenueTrend data={data.trends.revenue_monthly} />
          </ChartFrame>

          {!base && (
            <ChartFrame title="Deals por etapa" description="Distribucion actual del pipeline." icon={ChartPie} tone={TONE.violet}>
              <DonutStages rows={data.deals_by_stage} />
            </ChartFrame>
          )}
        </div>

        {!base && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartFrame title="Embudo de ventas" description="Oportunidades activas por etapa del pipeline." icon={Filter} tone={TONE.wine}>
              <PipelineFunnel rows={data.deals_by_stage} />
            </ChartFrame>

            <ChartFrame title="Deals ganados vs perdidos" description="Cierre de oportunidades — ultimos 12 meses." icon={Handshake} tone={TONE.green}>
              <DealsWonLost data={data.trends.deals_monthly} />
            </ChartFrame>
          </div>
        )}

        <div className="mt-4">
          <ChartFrame title="Top productos por existencia" description="Productos con mayor stock disponible." icon={Package} tone={TONE.indigo}>
            <TopProductsBars rows={data.top_products} />
          </ChartFrame>
        </div>
      </motion.div>

      {/* Activity (auditoría) */}
      {!base && (
        <motion.div variants={item}>
          <SectionLabel>Actividad</SectionLabel>
          <Card className="border-border/70">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold">Actividad reciente</h3>
              <ActivityTimeline items={data.recent_activity} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Secondary: productos con stock bajo (alertas de stock) */}
      {!base && (
        <motion.div variants={item}>
          <Card className="border-border/70">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Productos con stock bajo</h3>
                <IconBadge tone={TONE.red} size={9}>
                  <Boxes className="size-4" />
                </IconBadge>
              </div>
              <LowStockList products={data.low_stock_alerts} />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
