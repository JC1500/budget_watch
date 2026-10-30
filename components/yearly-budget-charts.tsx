"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetEntry } from "@/lib/budget-data";
import {
  calculateCAGR,
  calculateShare,
  calculateYoY,
  formatCroreCompact,
  formatCroreExact,
  formatPercent,
  formatShare,
} from "@/lib/format";

type YearTotal = {
  financialYear: string;
  total: number;
  yoy: number | null;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload?: Record<string, unknown> }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  const amount = typeof data.amount === "number" ? data.amount : data.total;
  const year =
    typeof data.financialYear === "string" ? data.financialYear : label;
  const yoy = typeof data.yoy === "number" ? data.yoy : null;
  const share = typeof data.share === "number" ? data.share : null;
  const absoluteChange =
    typeof data.amountChange === "number" ? data.amountChange : null;
  const percentChange =
    typeof data.percentageChange === "number" ? data.percentageChange : null;

  return (
    <div className="chart-tooltip">
      {typeof data.department === "string" && <strong>{data.department}</strong>}
      {year && <span>{year}</span>}
      {typeof amount === "number" && <span>{formatCroreExact(amount)}</span>}
      {absoluteChange !== null && (
        <span>Absolute change: {formatCroreExact(absoluteChange)}</span>
      )}
      {percentChange !== null && (
        <span>Percentage change: {formatPercent(percentChange)}</span>
      )}
      {yoy !== null && <span>YoY change: {formatPercent(yoy)}</span>}
      {share !== null && <span>Share of total: {formatShare(share)}</span>}
      {typeof data.rank === "number" && <span>Rank: {data.rank}</span>}
    </div>
  );
}

export function TotalBudgetTimeline({
  yearTotals,
}: {
  yearTotals: YearTotal[];
}) {
  return (
    <section className="panel" aria-labelledby="total-timeline-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="total-timeline-title">
            Total budget across years
          </h2>
          <p className="panel-subtitle">Sum of department totals · ₹ crore</p>
        </div>
      </div>
      {yearTotals.length > 0 ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearTotals} margin={{ top: 16, right: 20, bottom: 8, left: 18 }}>
              <CartesianGrid stroke="#e9ece7" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="financialYear" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatCroreCompact(value)}
                width={80}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                dataKey="total"
                name="Total allocation"
                stroke="#245c46"
                strokeWidth={2.5}
                dot={{ fill: "#245c46", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-chart">No yearly totals are available.</div>
      )}
      <div className="table-wrap">
        <table className="data-table compact-table">
          <thead>
            <tr>
              <th scope="col">Financial year</th>
              <th className="numeric" scope="col">Total</th>
              <th className="numeric" scope="col">Change vs prior year</th>
            </tr>
          </thead>
          <tbody>
            {yearTotals.map((year) => (
              <tr key={year.financialYear}>
                <td>{year.financialYear}</td>
                <td className="numeric">{formatCroreExact(year.total)}</td>
                <td className="numeric">{formatPercent(year.yoy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DepartmentHistoryChart({
  entries,
  initialId,
  financialYears,
  locked = false,
}: {
  entries: BudgetEntry[];
  initialId: string;
  financialYears: string[];
  locked?: boolean;
}) {
  const [departmentId, setDepartmentId] = useState(initialId);
  const byYear = useMemo(
    () => new Map(entries.filter((entry) => entry.id === departmentId).map((entry) => [entry.financialYear, entry])),
    [departmentId, entries],
  );
  const name = entries.filter((entry) => entry.id === departmentId).at(-1)?.department ?? "";
  const data = financialYears.map((year, index) => {
    const record = byYear.get(year);
    const previous = index > 0 ? byYear.get(financialYears[index - 1]) : undefined;
    return {
      financialYear: year,
      department: name,
      amount: record?.amountCrore ?? null,
      yoy:
        record && previous
          ? calculateYoY(record.amountCrore, previous.amountCrore)
          : null,
    };
  });
  const available = data.filter(
    (record): record is typeof record & { amount: number } =>
      typeof record.amount === "number",
  );
  const first = available[0];
  const last = available.at(-1);
  const yearsApart =
    first && last
      ? financialYears.indexOf(last.financialYear) -
        financialYears.indexOf(first.financialYear)
      : 0;
  const cagr =
    first && last && yearsApart > 0
      ? calculateCAGR(first.amount, last.amount, yearsApart)
      : null;

  return (
    <section className="panel" aria-labelledby="department-trend-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="department-trend-title">
            Department budget over time
          </h2>
          <p className="panel-subtitle">Available financial years · ₹ crore</p>
        </div>
      </div>
      {!locked && (
        <div className="trend-controls">
          <label className="field-label" htmlFor="trend-department">
            Department
            <select
              className="select-field"
              id="trend-department"
              onChange={(event) => setDepartmentId(event.target.value)}
              value={departmentId}
            >
              {[...new Map(entries.map((entry) => [entry.id, entry])).values()]
                .sort((a, b) => a.department.localeCompare(b.department))
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.department}</option>
                ))}
            </select>
          </label>
        </div>
      )}
      {available.length > 0 ? (
        <>
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 16, right: 18, bottom: 8, left: 18 }}>
                <CartesianGrid stroke="#e9ece7" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="financialYear" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCroreCompact(value)}
                  width={80}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  connectNulls={false}
                  dataKey="amount"
                  name="Department allocation"
                  stroke="#245c46"
                  strokeWidth={2.5}
                  dot={{ fill: "#245c46", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="trend-metrics">
            <div>
              <span>First available allocation</span>
              <strong>{first ? `${first.financialYear} · ${formatCroreExact(first.amount)}` : "—"}</strong>
            </div>
            <div>
              <span>Latest available allocation</span>
              <strong>{last ? `${last.financialYear} · ${formatCroreExact(last.amount)}` : "—"}</strong>
            </div>
            <div>
              <span>Annualized change</span>
              <strong>{formatPercent(cagr)}</strong>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-chart" role="status">
          <strong>Historical data is not available for this department.</strong>
          No records match the selected department across the available years.
        </div>
      )}
    </section>
  );
}

export function BudgetChangeChart({
  currentEntries,
  previousEntries,
  year,
}: {
  currentEntries: BudgetEntry[];
  previousEntries: BudgetEntry[];
  year: string;
}) {
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [metric, setMetric] = useState<"amount" | "percentage">("amount");
  const previous = new Map(previousEntries.map((entry) => [entry.id, entry]));
  const currentTotal = currentEntries.reduce((sum, entry) => sum + entry.amountCrore, 0);
  const data = currentEntries.flatMap((entry) => {
    const old = previous.get(entry.id);
    if (!old) return [];
    const amountChange = entry.amountCrore - old.amountCrore;
    const percentageChange = calculateYoY(entry.amountCrore, old.amountCrore);
    return [{
      ...entry,
      financialYear: year,
      amount: entry.amountCrore,
      amountChange,
      percentageChange,
      share: calculateShare(entry.amountCrore, currentTotal) ?? 0,
    }];
  });
  const filtered = data
    .filter((entry) =>
      metric === "percentage" && entry.percentageChange === null
        ? false
        : direction === "increase"
        ? entry.amountChange > 0
        : entry.amountChange < 0,
    )
    .sort((a, b) => {
      const aValue = metric === "amount" ? Math.abs(a.amountChange) : Math.abs(a.percentageChange ?? 0);
      const bValue = metric === "amount" ? Math.abs(b.amountChange) : Math.abs(b.percentageChange ?? 0);
      return bValue - aValue;
    })
    .slice(0, 10);

  return (
    <section className="panel" aria-labelledby="change-chart-title">
      <div className="panel-header chart-heading">
        <div>
          <h2 className="panel-title" id="change-chart-title">Largest budget changes</h2>
          <p className="panel-subtitle">
            {year} compared with the previous available year
          </p>
        </div>
        <div className="chart-control-groups">
          <div className="chart-controls" role="group" aria-label="Change direction">
            {(["increase", "decrease"] as const).map((value) => (
              <button
                aria-pressed={direction === value}
                key={value}
                onClick={() => setDirection(value)}
                type="button"
              >
                {value === "increase" ? "Increase" : "Decrease"}
              </button>
            ))}
          </div>
          <div className="chart-controls" role="group" aria-label="Change measurement">
            <button aria-pressed={metric === "amount"} onClick={() => setMetric("amount")} type="button">₹ crore</button>
            <button aria-pressed={metric === "percentage"} onClick={() => setMetric("percentage")} type="button">%</button>
          </div>
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="change-chart">
          <ResponsiveContainer width="100%" height={Math.max(260, filtered.length * 38)}>
            <BarChart
              data={filtered}
              layout="vertical"
              margin={{ top: 8, right: 22, bottom: 8, left: 5 }}
            >
              <CartesianGrid stroke="#edf0eb" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="department"
                width={190}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#45504a", fontSize: 10 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey={metric === "amount" ? "amountChange" : "percentageChange"}
                name={metric === "amount" ? "Absolute change" : "Percentage change"}
                fill="#4a8062"
                radius={[0, 3, 3, 0]}
              >
                <LabelList
                  dataKey={metric === "amount" ? "amountChange" : "percentageChange"}
                  position="right"
                  formatter={(value) =>
                    value == null
                      ? "—"
                      : metric === "amount"
                        ? formatCroreCompact(Number(value))
                        : formatPercent(Number(value))
                  }
                  style={{ fill: "#53615a", fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-chart" role="status">
          <strong>No matched year-over-year changes are available.</strong>
          Department changes require records in both the selected and previous
          year, with a non-zero previous allocation.
        </div>
      )}
    </section>
  );
}

export function BudgetDistributionHistogram({
  entries,
}: {
  entries: BudgetEntry[];
}) {
  const bins = [
    { name: "Below ₹0 Cr", min: Number.NEGATIVE_INFINITY, max: 0 },
    { name: "₹0–1,000 Cr", min: 0, max: 1_000 },
    { name: "₹1,000–5,000 Cr", min: 1_000, max: 5_000 },
    { name: "₹5,000–10,000 Cr", min: 5_000, max: 10_000 },
    { name: "₹10,000–50,000 Cr", min: 10_000, max: 50_000 },
    { name: "₹50,000 Cr+", min: 50_000, max: Number.POSITIVE_INFINITY },
  ];
  const data = bins.map((bin) => ({
    ...bin,
    count: entries.filter(
      (entry) =>
        entry.amountCrore >= bin.min && entry.amountCrore < bin.max,
    ).length,
  }));

  return (
    <section className="panel" aria-labelledby="histogram-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="histogram-title">Budget size distribution</h2>
          <p className="panel-subtitle">Number of departments by allocation range</p>
        </div>
      </div>
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 18, bottom: 18, left: 0 }}>
            <CartesianGrid stroke="#e9ece7" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 9 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="count" name="Departments" fill="#6e937b" radius={[3, 3, 0, 0]}>
              <LabelList dataKey="count" position="top" style={{ fill: "#45504a", fontSize: 10 }} />
              {data.map((entry) => <Cell key={entry.name} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function DepartmentHeatmap({
  records,
  years,
}: {
  records: BudgetEntry[];
  years: string[];
}) {
  const [query, setQuery] = useState("");
  const [metric, setMetric] = useState<"amount" | "percentage">("amount");
  const [topN, setTopN] = useState(20);
  const [sortDescending, setSortDescending] = useState(true);

  const allDepartments = useMemo(
    () => [...new Map(records.map((record) => [record.id, record])).values()],
    [records],
  );
  const amountMap = useMemo(
    () => new Map(records.map((record) => [`${record.id}|${record.financialYear}`, record.amountCrore])),
    [records],
  );
  const visible = allDepartments
    .filter((entry) => entry.department.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      (sortDescending ? -1 : 1) * (a.amountCrore - b.amountCrore),
    )
    .slice(0, topN);
  const values = records.map((entry) => entry.amountCrore);
  const maxAmount = Math.max(...values, 1);
  const maxPercentage = 100;

  function valueFor(id: string, yearIndex: number) {
    const year = years[yearIndex];
    const amount = amountMap.get(`${id}|${year}`);
    if (amount === undefined) return null;
    if (metric === "amount") return amount;
    if (yearIndex === 0) return null;
    const previous = amountMap.get(`${id}|${years[yearIndex - 1]}`);
    return previous === undefined ? null : calculateYoY(amount, previous);
  }

  function cellStyle(value: number | null) {
    if (value === null) return { backgroundColor: "#f0f1ee", color: "#89928c" };
    const max = metric === "amount" ? maxAmount : maxPercentage;
    const magnitude = Math.min(Math.abs(value) / max, 1);
    if (metric === "percentage" && value < 0) {
      return {
        backgroundColor: `rgba(174, 123, 92, ${0.12 + magnitude * 0.6})`,
        color: magnitude > 0.55 ? "#fff" : "#503a2f",
      };
    }
    return {
      backgroundColor: `rgba(63, 117, 81, ${0.1 + magnitude * 0.65})`,
      color: magnitude > 0.55 ? "#fff" : "#20372a",
    };
  }

  return (
    <section className="panel table-panel" aria-labelledby="heatmap-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="heatmap-title">Department budget heatmap</h2>
          <p className="panel-subtitle">Rows are ranked by the latest available allocation</p>
        </div>
        <div className="chart-controls" role="group" aria-label="Heatmap measure">
          <button aria-pressed={metric === "amount"} onClick={() => setMetric("amount")} type="button">Budget</button>
          <button aria-pressed={metric === "percentage"} onClick={() => setMetric("percentage")} type="button">YoY %</button>
        </div>
      </div>
      <div className="heatmap-tools">
        <label className="sr-only" htmlFor="heatmap-search">Search departments</label>
        <input
          className="search-field"
          id="heatmap-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search departments"
          type="search"
          value={query}
        />
        <button
          className="secondary-button"
          onClick={() => setSortDescending((value) => !value)}
          type="button"
        >
          Sort {sortDescending ? "↓" : "↑"}
        </button>
        <label className="field-label heatmap-top" htmlFor="heatmap-top">
          Show
          <select
            className="select-field"
            id="heatmap-top"
            onChange={(event) => setTopN(Number(event.target.value))}
            value={topN}
          >
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
            <option value={allDepartments.length}>All</option>
          </select>
        </label>
      </div>
      <div className="heatmap-wrap" role="region" aria-label="Department budget heatmap" tabIndex={0}>
        <table className="heatmap-table">
          <thead>
            <tr>
              <th scope="col">Department</th>
              {years.map((year) => <th className="numeric" key={year} scope="col">{year}</th>)}
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => (
              <tr key={entry.id}>
                <th scope="row">
                  <Link href={`/departments/${entry.id}`} title={entry.department}>
                    {entry.department}
                  </Link>
                </th>
                {years.map((year, index) => {
                  const value = valueFor(entry.id, index);
                  return (
                    <td key={year} style={cellStyle(value)} title={value === null ? "No previous-year comparison" : metric === "amount" ? formatCroreExact(value) : formatPercent(value)}>
                      {value === null ? "—" : metric === "amount" ? formatCroreCompact(value) : formatPercent(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="empty-state" role="status">
            <strong>No departments match your search.</strong>
            Try a different department name.
          </div>
        )}
      </div>
    </section>
  );
}

export function DepartmentIndexedGrowthChart({
  rows,
}: {
  rows: {
    year: string;
    departmentIndex: number;
    overallIndex: number;
  }[];
}) {
  return (
    <section className="panel" aria-labelledby="indexed-growth-chart-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="indexed-growth-chart-title">
            Indexed growth
          </h2>
          <p className="panel-subtitle">
            First common year = 100 · index values, not ₹ crore
          </p>
        </div>
      </div>
      {rows.length > 1 ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 16, right: 20, bottom: 8, left: 18 }}>
              <CartesianGrid stroke="#e9ece7" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="year" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} width={50} />
              <Tooltip />
              <Legend />
              <Line
                dataKey="departmentIndex"
                name="Department"
                stroke="#245c46"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                dataKey="overallIndex"
                name="Overall budget"
                stroke="#b2874e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-chart">
          Indexed growth requires two or more common financial years.
        </div>
      )}
    </section>
  );
}
