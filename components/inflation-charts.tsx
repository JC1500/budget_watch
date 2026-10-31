"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InflationRecord } from "@/lib/data/inflation";

type InflationMetric = "inflation" | "index";

type ChartPoint = InflationRecord & {
  monthYear: string;
  value: number;
};

function getChartPoints(
  records: InflationRecord[],
  metric: InflationMetric,
): ChartPoint[] {
  const points: ChartPoint[] = [];

  for (const record of records) {
    const value = record[metric];
    if (value === null || !Number.isFinite(value)) continue;

    points.push({
      ...record,
      monthYear: `${record.month.slice(0, 3)} ${record.year}`,
      value,
    });
  }

  return points;
}

function MetricTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartPoint }>;
  metric: InflationMetric;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point || point[metric] === null) return null;

  return (
    <div className="chart-tooltip">
      <strong>{point.month} {point.year}</strong>
      <div className="chart-tooltip-row">
        <span>{metric === "inflation" ? "Inflation" : "CPI Index"}</span>
        <strong>
          {metric === "inflation"
            ? `${point.value.toFixed(2)}%`
            : point.value.toFixed(2)}
        </strong>
      </div>
      {metric === "inflation" && point.index !== null && (
        <div className="chart-tooltip-row">
          <span>CPI Index</span>
          <strong>{point.index.toFixed(2)}</strong>
        </div>
      )}
    </div>
  );
}

function InflationLineChart({
  records,
  metric,
  title,
}: {
  records: InflationRecord[];
  metric: InflationMetric;
  title: string;
}) {
  const data = getChartPoints(records, metric);
  const values = data.map((record) => record.value);
  const minimum = values.length > 0 ? Math.min(...values) : 0;
  const maximum = values.length > 0 ? Math.max(...values) : 0;
  const padding = Math.max((maximum - minimum) * 0.15, Math.abs(maximum) * 0.01, 0.1);
  const unit = metric === "inflation" ? "%" : "";

  return (
    <section className="panel inflation-chart-panel" aria-label={title}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-subtitle">All India · Combined · CPI (General)</p>
        </div>
      </div>
      {data.length > 0 ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              accessibilityLayer
              aria-label={`${title} by month`}
              data={data}
              margin={{ top: 16, right: 20, bottom: 8, left: 18 }}
            >
              <CartesianGrid
                stroke="var(--chart-grid)"
                strokeDasharray="3 4"
                vertical={false}
              />
              <XAxis
                dataKey="monthYear"
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                tickLine={false}
                minTickGap={18}
              />
              <YAxis
                axisLine={false}
                domain={[
                  minimum - padding,
                  maximum + padding,
                ]}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                tickFormatter={(value: number) => `${value.toFixed(1)}${unit}`}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<MetricTooltip metric={metric} />} />
              <Line
                dataKey="value"
                name={metric === "inflation" ? "Inflation" : "CPI Index"}
                stroke="var(--accent)"
                strokeWidth={2.5}
                dot={{ fill: "var(--accent)", r: 4 }}
                activeDot={{ r: 6 }}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-chart">
          {metric === "inflation"
            ? "CPI inflation data unavailable."
            : "CPI Index data unavailable."}
        </div>
      )}
    </section>
  );
}

export function InflationOverviewChart({
  records,
}: {
  records: InflationRecord[];
}) {
  const data = getChartPoints(records, "inflation");

  return (
    <Link
      className="inflation-overview-link"
      href="/inflation"
      aria-label="Open the CPI Inflation detail page"
    >
      <section className="panel inflation-overview-panel" aria-labelledby="inflation-trend-title">
        <div className="panel-header">
          <div>
            <h2 className="panel-title" id="inflation-trend-title">
              CPI inflation trend
            </h2>
            <p className="panel-subtitle">All India · Combined · CPI (General)</p>
          </div>
        </div>
        {data.length > 0 ? (
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                accessibilityLayer
                aria-label="CPI inflation percentage by month"
                data={data}
                margin={{ top: 16, right: 20, bottom: 8, left: 18 }}
              >
                <CartesianGrid
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="monthYear"
                  axisLine={false}
                  tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                  tickLine={false}
                  minTickGap={18}
                />
                <YAxis
                  axisLine={false}
                  domain={["auto", "auto"]}
                  tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                  tickFormatter={(value: number) => `${value.toFixed(1)}%`}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<MetricTooltip metric="inflation" />} />
                <Line
                  dataKey="value"
                  name="Inflation"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--accent)", r: 4 }}
                  activeDot={{ r: 6 }}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-chart">CPI inflation data unavailable.</div>
        )}
        <span className="inflation-chart-link-label">View CPI details →</span>
      </section>
    </Link>
  );
}

export function InflationHistoryCharts({
  records,
}: {
  records: InflationRecord[];
}) {
  return (
    <div className="inflation-history-charts">
      <InflationLineChart
        records={records}
        metric="inflation"
        title="Inflation history"
      />
      <InflationLineChart
        records={records}
        metric="index"
        title="CPI Index history"
      />
    </div>
  );
}
