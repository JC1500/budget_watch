"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SchemeBudgetEntry } from "@/lib/budget-data";
import {
  calculateShare,
  calculateYoY,
  formatCroreCompact,
  formatCroreExact,
  formatPercent,
  formatShare,
} from "@/lib/format";

const topOptions = [10, 20, Number.POSITIVE_INFINITY] as const;

function BreakdownTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: SchemeBudgetEntry & {
    shareOfDepartment: number | null;
    shareOfTotal: number | null;
    totalBudget: number;
  } }[];
}) {
  const entry = payload?.[0]?.payload;
  if (!active || !entry) return null;
  return (
    <div className="chart-tooltip">
      <strong>{entry.scheme}</strong>
      <span>{entry.department}</span>
      <span>{entry.financialYear}</span>
      <div className="chart-tooltip-row"><span>Allocation</span><strong>{formatCroreExact(entry.amountCrore)}</strong></div>
      <div className="chart-tooltip-row"><span>Share of department</span><strong>{formatShare(entry.shareOfDepartment)}</strong></div>
      <div className="chart-tooltip-row"><span>Share of total budget</span><strong>{formatShare(entry.shareOfTotal)}</strong></div>
      <div className="chart-tooltip-row"><span>Total budget</span><strong>{formatCroreExact(entry.totalBudget)}</strong></div>
    </div>
  );
}

export function DepartmentSchemeBreakdown({
  entries,
  previousEntries,
  year,
  departmentTotal,
  totalBudget,
}: {
  entries: SchemeBudgetEntry[];
  previousEntries: SchemeBudgetEntry[];
  year: string;
  departmentTotal: number | null;
  totalBudget: number;
}) {
  const [topN, setTopN] = useState<number>(10);
  const previousById = useMemo(
    () => new Map(previousEntries.map((entry) => [entry.id, entry])),
    [previousEntries],
  );
  const ranked = useMemo(
    () =>
      [...entries]
        .sort((a, b) => b.amountCrore - a.amountCrore)
        .map((entry) => ({
          ...entry,
          shareOfDepartment:
            departmentTotal === null
              ? null
              : calculateShare(entry.amountCrore, departmentTotal),
          shareOfTotal: calculateShare(entry.amountCrore, totalBudget),
          totalBudget,
        })),
    [departmentTotal, entries, totalBudget],
  );
  const visible = ranked.slice(0, topN);
  const chartHeight = Math.max(260, Math.min(visible.length * 38 + 54, 780));

  return (
    <section className="panel scheme-breakdown" aria-labelledby="department-schemes-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="department-schemes-title">Schemes in this department</h2>
          <p className="panel-subtitle">
            {entries.length} source schemes · {year} · Scheme allocations are not assumed to sum to the department total.
          </p>
        </div>
        <div className="chart-controls" role="group" aria-label="Schemes shown">
          {topOptions.map((option) => (
            <button
              aria-pressed={topN === option}
              key={option}
              onClick={() => setTopN(option)}
              type="button"
            >
              {Number.isFinite(option) ? `Top ${option}` : "All"}
            </button>
          ))}
        </div>
      </div>
      {visible.length > 0 ? (
        <div className="scheme-breakdown-chart" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visible}
              layout="vertical"
              margin={{ top: 8, right: 24, bottom: 8, left: 12 }}
            >
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-axis)" }}
                tickFormatter={(value: number) => formatCroreCompact(value)}
              />
              <YAxis
                type="category"
                dataKey="scheme"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                width={210}
              />
              <Tooltip content={<BreakdownTooltip />} />
              <Bar dataKey="amountCrore" name="Allocation" fill="var(--chart-positive)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-chart">No scheme allocations are available for this department and year.</div>
      )}
      <div className="table-wrap">
        <table className="data-table scheme-data-table">
          <thead>
            <tr>
              <th scope="col">Scheme</th>
              <th className="numeric" scope="col">Allocation</th>
              <th className="numeric" scope="col">Share of department</th>
              <th className="numeric" scope="col">Share of total budget</th>
              <th className="numeric" scope="col">Previous year</th>
              <th className="numeric" scope="col">YoY %</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => {
              const previous = previousById.get(entry.id);
              return (
                <tr key={entry.id}>
                  <td>{entry.scheme}</td>
                  <td className="numeric">{formatCroreExact(entry.amountCrore)}</td>
                  <td className="numeric">{formatShare(entry.shareOfDepartment)}</td>
                  <td className="numeric">{formatShare(entry.shareOfTotal)}</td>
                  <td className="numeric">{previous ? formatCroreExact(previous.amountCrore) : "—"}</td>
                  <td className="numeric">{formatPercent(previous ? calculateYoY(entry.amountCrore, previous.amountCrore) : null)}</td>
                  <td><Link className="text-link" href={`/schemes/${encodeURIComponent(entry.id)}?year=${encodeURIComponent(year)}`}>View scheme</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="ranking-caption">
        Shares use the selected year&apos;s department allocation ({departmentTotal === null ? "—" : formatCroreExact(departmentTotal)}) and government budget ({formatCroreExact(totalBudget)}), respectively.
      </p>
    </section>
  );
}
