import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MoneyDerived } from "@/lib/money";
import { formatCompactUsd, formatPercent, formatUsd } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

const tooltipStyle = {
  background: "var(--elevated)",
  border: "0.5px solid var(--border)",
  borderRadius: "12px",
  color: "var(--fg)",
  fontSize: 13,
};

type MonthColumn = {
  key: "collectedMonthly" | "contractedMrr" | "collectedAll" | "teamCosts" | "collectionRate";
  label: string;
  kind?: "money" | "percent";
};

export function MoneyCharts({
  derived,
  loading,
}: {
  derived: MoneyDerived | null;
  loading: boolean;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const months = derived?.months ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionBoundary title="MRR Growth Over Time">
      <ChartCard
        title="MRR Growth Over Time"
        caption="Solid line is cash collected from paid monthly invoices. Dotted line is contracted MRR from the current active roster (not audited history)."
        loading={loading}
        empty={!loading && !derived?.hasMrrGrowth}
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={months} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted)", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatCompactUsd(value)}
                tickCount={5}
                width={44}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatUsd(Number(value ?? 0))}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="collectedMonthly"
                name="Collected"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.18}
                isAnimationActive={!reduceMotion}
              />
              <Line
                type="monotone"
                dataKey="contractedMrr"
                name="Contracted"
                stroke="var(--teal)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={!reduceMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        }
      >
        <MonthTable
          months={months}
          columns={[
            { key: "collectedMonthly", label: "Collected" },
            { key: "contractedMrr", label: "Contracted" },
          ]}
        />
      </ChartCard>

      </SectionBoundary>
      <SectionBoundary title="Revenue vs Costs">
      <ChartCard
        title="Revenue vs Costs"
        caption="Revenue is all paid invoices in that month. Costs use live team assignments — there are no historical cost snapshots, so each month shows current active-client team cost."
        loading={loading}
        empty={!loading && !derived?.hasRevenueVsCosts}
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted)", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatCompactUsd(value)}
                tickCount={5}
                width={44}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatUsd(Number(value ?? 0))}
              />
              <Legend />
              <Bar
                dataKey="collectedAll"
                name="Revenue"
                fill="var(--accent)"
                radius={[6, 6, 0, 0]}
                isAnimationActive={!reduceMotion}
              />
              <Bar
                dataKey="teamCosts"
                name="Team cost"
                fill="var(--warning)"
                radius={[6, 6, 0, 0]}
                isAnimationActive={!reduceMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        }
      >
        <MonthTable
          months={months}
          columns={[
            { key: "collectedAll", label: "Revenue" },
            { key: "teamCosts", label: "Team cost" },
          ]}
        />
      </ChartCard>

      </SectionBoundary>
      <div className="lg:col-span-2">
      <SectionBoundary title="Payment Collection Rate">
      <ChartCard
        title="Payment Collection Rate"
        caption="Paid amounts ÷ amounts due through today in the selected window."
        loading={loading}
        empty={!loading && !derived?.hasCollectionHistory}
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={months} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted)", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                width={48}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatPercent(Number(value ?? 0), 0)}
              />
              <Line
                type="monotone"
                dataKey="collectionRate"
                name="Monthly rate"
                stroke="var(--success)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={!reduceMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        }
      >
        <div className="mt-4">
          <p className="text-page font-semibold tracking-tight tabular-nums">
            {formatPercent(derived?.collectionRate ?? 0, 0)}
          </p>
          <p className="mt-1 text-caption text-muted">
            {formatUsd(derived?.collectionPaid ?? 0)} collected of{" "}
            {formatUsd(derived?.collectionDue ?? 0)} due
          </p>
          <div
            className="mt-3 h-3 overflow-hidden rounded-full bg-secondary-surface"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(derived?.collectionRate ?? 0)}
            aria-label="Collection rate"
          >
            <div
              className="h-full rounded-full bg-success transition-[width] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none"
              style={{
                width: `${Math.min(100, Math.max(0, derived?.collectionRate ?? 0))}%`,
              }}
            />
          </div>
        </div>
        <MonthTable
          months={months}
          columns={[{ key: "collectionRate", label: "Rate", kind: "percent" }]}
        />
      </ChartCard>
      </SectionBoundary>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  caption,
  loading,
  empty,
  className,
  chart,
  children,
}: {
  title: string;
  caption: string;
  loading: boolean;
  empty: boolean;
  className?: string;
  chart: ReactNode;
  children?: ReactNode;
}) {
  return (
    <GlassCard className={className}>
      <h2 className="text-card font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-caption text-muted">{caption}</p>
      {children}
      <div className="mt-4 h-64 w-full min-w-0">
        {loading ? <Skeleton className="h-full w-full" /> : null}
        {!loading && empty ? (
          <div className="grid h-full place-items-center">
            <p className="text-body text-muted">Not enough data yet</p>
          </div>
        ) : null}
        {!loading && !empty ? chart : null}
      </div>
    </GlassCard>
  );
}

function MonthTable({
  months,
  columns,
}: {
  months: MoneyDerived["months"];
  columns: MonthColumn[];
}) {
  if (months.length === 0) return null;
  return (
    <table className="sr-only">
      <thead>
        <tr>
          <th>Month</th>
          {columns.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {months.map((month) => (
          <tr key={month.key}>
            <td>{month.label}</td>
            {columns.map((column) => (
              <td key={column.key}>
                {column.kind === "percent"
                  ? formatPercent(month[column.key], 0)
                  : formatUsd(month[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
