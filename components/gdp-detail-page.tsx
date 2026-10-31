"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  GDPDetailRecord,
  GDPMetric,
  GDPOverviewData,
} from "@/lib/data/gdp";
import {
  formatCroreCompact,
  formatGDPExact,
  formatPercent,
} from "@/lib/format";

const METRIC_LABELS: Record<GDPMetric, string> = {
  nominal: "Nominal GDP",
  real: "Real GDP",
  growth: "Real GDP Growth",
};

const COMPARISON_COLORS = ["var(--accent)", "var(--chart-positive)"];

function formatExact(value: number | null) {
  return value === null ? "Not available" : formatGDPExact(value);
}

function formatGrowth(value: number | null) {
  return value === null ? "Not available" : formatPercent(value);
}

function GDPValueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { label?: string; value?: number } }>;
}) {
  const entry = payload?.[0]?.payload;
  if (!active || !entry || typeof entry.value !== "number") return null;

  return (
    <div className="chart-tooltip">
      <strong>{entry.label}</strong>
      <span>{formatGDPExact(entry.value)}</span>
    </div>
  );
}

function GDPHistoryTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { year?: string; value?: number } }>;
  metric: GDPMetric;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point || typeof point.value !== "number") return null;

  return (
    <div className="chart-tooltip">
      <strong>{point.year}</strong>
      <span>
        {metric === "growth"
          ? formatPercent(point.value)
          : formatGDPExact(point.value)}
      </span>
    </div>
  );
}

export function GDPDetailPage({
  data,
  detail,
  initialMetric,
}: {
  data: GDPOverviewData;
  detail: GDPDetailRecord;
  initialMetric: GDPMetric;
}) {
  const [historyMetric, setHistoryMetric] = useState<GDPMetric>(initialMetric);
  const { record, previousRecord } = detail;
  const comparisonData = [
    { label: "Nominal GDP", value: record.nominalGDP },
    { label: "Real GDP", value: record.realGDP },
  ].filter(
    (item): item is { label: string; value: number } =>
      item.value !== null && Number.isFinite(item.value),
  );
  const historyData =
    historyMetric === "nominal"
      ? data.nominalSeries
      : historyMetric === "real"
        ? data.realSeries
        : data.growthSeries;
  const historyMaximum = Math.max(
    0,
    ...historyData.map((item) => item.value),
  );
  const historyMinimum = Math.min(
    0,
    ...historyData.map((item) => item.value),
  );
  return (
    <main className="page-shell gdp-detail-page">
      <nav className="gdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Overview</Link>
        <span aria-hidden="true">/</span>
        <span>GDP</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{record.year}</span>
      </nav>

      <header className="gdp-detail-intro">
        <Link className="gdp-back-link" href="/">
          <span aria-hidden="true">←</span> Back to Overview
        </Link>
        <p className="eyebrow">National Accounts Statistics</p>
        <h1>GDP — {record.year}</h1>
        <p className="intro-copy">
          Gross Domestic Product · Financial year {record.year}
        </p>
      </header>

      <section
        className="gdp-detail-summary"
        aria-label={`GDP summary for ${record.year}`}
      >
        <article className="gdp-summary-metric">
          <span>Nominal GDP</span>
          <strong>{formatExact(record.nominalGDP)}</strong>
          <small>GDP at current prices</small>
        </article>
        <article className="gdp-summary-metric">
          <span>Real GDP</span>
          <strong>{formatExact(record.realGDP)}</strong>
          <small>GDP at constant prices</small>
        </article>
        <article className="gdp-summary-metric">
          <span>Real GDP Growth</span>
          <strong>{formatGrowth(detail.growthPercent)}</strong>
          <small>Calculated from constant-price GDP</small>
        </article>
        <article className="gdp-summary-metric">
          <span>Revision</span>
          <strong>
            {record.revision === "Unavailable" ? "Not available" : record.revision}
          </strong>
          <small>Base year · {record.baseYear === "Unavailable" ? "—" : record.baseYear}</small>
        </article>
      </section>

      <div className="gdp-detail-analysis-grid">
        <section className="panel gdp-detail-section">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">GDP comparison</h2>
              <p className="panel-subtitle">Current-price and constant-price GDP · {record.year}</p>
            </div>
          </div>
          {comparisonData.length > 0 ? (
            <div className="gdp-comparison-chart">
              <ResponsiveContainer width="100%" height={170}>
                <BarChart
                  accessibilityLayer
                  aria-label={`Nominal and real GDP comparison for ${record.year}`}
                  data={comparisonData}
                  layout="vertical"
                  margin={{ top: 8, right: 28, bottom: 4, left: 8 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 4"
                  />
                  <XAxis
                    axisLine={false}
                    domain={[0, "dataMax"]}
                    tick={{ fill: "var(--chart-axis)", fontSize: 9 }}
                    tickFormatter={(value: number) => formatCroreCompact(value)}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="label"
                    tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
                    tickLine={false}
                    type="category"
                    width={92}
                  />
                  <Tooltip content={<GDPValueTooltip />} />
                  <Bar
                    dataKey="value"
                    isAnimationActive={false}
                    maxBarSize={26}
                    radius={[0, 5, 5, 0]}
                  >
                    {comparisonData.map((item, index) => (
                      <Cell
                        fill={COMPARISON_COLORS[index]}
                        key={item.label}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="gdp-detail-empty">GDP comparison is not available.</p>
          )}
        </section>

        <section className="panel gdp-detail-section">
          <div className="panel-header gdp-history-header">
            <div>
              <h2 className="panel-title">Historical GDP trend</h2>
              <p className="panel-subtitle">
                {data.records.length} actual annual observations
              </p>
            </div>
            <label className="gdp-history-picker">
              <span>View</span>
              <select
                aria-label="GDP history metric"
                className="chart-view-select"
                onChange={(event) => {
                  const nextMetric = event.target.value;
                  if (
                    nextMetric === "nominal" ||
                    nextMetric === "real" ||
                    nextMetric === "growth"
                  ) {
                    setHistoryMetric(nextMetric);
                  }
                }}
                value={historyMetric}
              >
                <option value="nominal">Nominal GDP</option>
                <option value="real">Real GDP</option>
                <option value="growth">Real GDP Growth</option>
              </select>
            </label>
          </div>
          {historyData.length > 0 ? (
            <div className="gdp-history-chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  accessibilityLayer
                  aria-label={`${METRIC_LABELS[historyMetric]} historical trend`}
                  data={historyData}
                  margin={{ top: 12, right: 16, bottom: 8, left: 10 }}
                >
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 4"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="year"
                    interval={0}
                    tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    domain={
                      historyMetric === "growth"
                        ? [
                            historyMinimum < 0 ? "dataMin" : 0,
                            historyMaximum > 0 ? "dataMax" : 1,
                          ]
                        : [0, "dataMax"]
                    }
                    tick={{ fill: "var(--chart-axis)", fontSize: 9 }}
                    tickFormatter={(value: number) =>
                      historyMetric === "growth"
                        ? `${Number(value).toLocaleString("en-IN", {
                            maximumFractionDigits: 1,
                          })}%`
                        : formatCroreCompact(value)
                    }
                    tickLine={false}
                    width={74}
                  />
                  {historyMetric === "growth" && (
                    <ReferenceLine
                      y={0}
                      stroke="var(--chart-axis)"
                      strokeDasharray="4 3"
                    />
                  )}
                  <Tooltip
                    content={<GDPHistoryTooltip metric={historyMetric} />}
                  />
                  <Line
                    activeDot={{ r: 5 }}
                    dataKey="value"
                    dot={{ r: 4, strokeWidth: 2 }}
                    isAnimationActive={false}
                    name={METRIC_LABELS[historyMetric]}
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="gdp-detail-empty">
              No historical observations are available for this metric.
            </p>
          )}
        </section>
      </div>

      <section className="panel gdp-detail-section gdp-year-comparison">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              Compared with previous available financial year
            </h2>
            <p className="panel-subtitle">
              {previousRecord
                ? `${previousRecord.year} compared with ${record.year}`
                : "No previous annual observation is available for comparison."}
            </p>
          </div>
        </div>
        {previousRecord ? (
          <div className="gdp-comparison-table-wrap">
            <table className="gdp-comparison-table">
              <thead>
                <tr>
                  <th scope="col">Indicator</th>
                  <th scope="col">{previousRecord.year}</th>
                  <th scope="col">{record.year}</th>
                  <th scope="col">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Nominal GDP</th>
                  <td>{formatExact(previousRecord.nominalGDP)}</td>
                  <td>{formatExact(record.nominalGDP)}</td>
                  <td>{formatGrowth(detail.nominalGrowthPercent)}</td>
                </tr>
                <tr>
                  <th scope="row">Real GDP</th>
                  <td>{formatExact(previousRecord.realGDP)}</td>
                  <td>{formatExact(record.realGDP)}</td>
                  <td>{formatGrowth(detail.growthPercent)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="gdp-detail-empty">
            Previous nominal GDP, real GDP, and year-over-year changes are not
            available.
          </p>
        )}
      </section>

      <section className="panel gdp-detail-section">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Understanding the GDP data</h2>
            <p className="panel-subtitle">
              How Budget Watch uses the MoSPI NAS observations
            </p>
          </div>
        </div>
        <div className="gdp-understanding-content">
          <article>
            <h3>Nominal GDP</h3>
            <p>{data.methodology.explanations.nominal}</p>
          </article>
          <article>
            <h3>Real GDP</h3>
            <p>{data.methodology.explanations.real}</p>
          </article>
          <article>
            <h3>Real GDP Growth</h3>
            <p>{data.methodology.explanations.growth}</p>
            <dl className="gdp-calculation-list">
              <div>
                <dt>Previous real GDP · {previousRecord?.year ?? "—"}</dt>
                <dd>{formatExact(previousRecord?.realGDP ?? null)}</dd>
              </div>
              <div>
                <dt>Current real GDP · {record.year}</dt>
                <dd>{formatExact(record.realGDP)}</dd>
              </div>
              <div>
                <dt>Calculation</dt>
                <dd>
                  {detail.growthPercent !== null &&
                  record.realGDP !== null &&
                  previousRecord?.realGDP !== null &&
                  previousRecord?.realGDP !== undefined
                    ? `((${formatGDPExact(record.realGDP)} / ${formatGDPExact(previousRecord.realGDP)}) - 1) × 100 = ${formatPercent(detail.growthPercent)}`
                    : "Not available"}
                </dd>
              </div>
              <div>
                <dt>Nominal GDP growth · current-price GDP</dt>
                <dd>{formatGrowth(detail.nominalGrowthPercent)}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section className="panel gdp-detail-section">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Source &amp; methodology</h2>
            <p className="panel-subtitle">
              Record-level metadata for {record.year}
            </p>
          </div>
        </div>
        <dl className="gdp-source-table">
          <div>
            <dt>Source</dt>
            <dd>{data.methodology.source}</dd>
          </div>
          <div>
            <dt>Indicator</dt>
            <dd>{record.indicator === "Unavailable" ? "—" : record.indicator}</dd>
          </div>
          <div>
            <dt>Financial year</dt>
            <dd>{record.year}</dd>
          </div>
          <div>
            <dt>Base year</dt>
            <dd>{record.baseYear === "Unavailable" ? "—" : record.baseYear}</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd>{record.revision === "Unavailable" ? "—" : record.revision}</dd>
          </div>
          <div>
            <dt>Frequency</dt>
            <dd>{record.frequency === "Unavailable" ? "—" : record.frequency}</dd>
          </div>
          <div>
            <dt>Unit</dt>
            <dd>{record.unit || "—"}</dd>
          </div>
        </dl>
        <details className="gdp-technical-details">
          <summary>Technical source information</summary>
          <div>
            <p>MoSPI NAS source endpoint</p>
            <code>{data.methodology.sourceReference}</code>
            <p>GDP fields used</p>
            <code>current_price · constant_price · year · revision · base_year · frequency · unit</code>
            <p>Growth method</p>
            <code>
              Real GDP growth uses constant_price; nominal GDP growth uses
              current_price.
            </code>
          </div>
        </details>
      </section>
    </main>
  );
}
