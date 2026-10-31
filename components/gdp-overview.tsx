"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GDPOverviewData, GDPSeriesRecord } from "@/lib/data/gdp";
import { formatCroreCompact, formatGDPExact } from "@/lib/format";

type GDPChartPoint = GDPSeriesRecord;

type GDPTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: unknown }>;
};

function isGDPChartPoint(value: unknown): value is GDPChartPoint {
  if (typeof value !== "object" || value === null) return false;
  const point = value as Partial<GDPChartPoint>;
  return (
    typeof point.year === "string" &&
    typeof point.value === "number" &&
    Number.isFinite(point.value) &&
    typeof point.record === "object" &&
    point.record !== null
  );
}

function formatGDPAxis(value: number) {
  const lakhCrore = value / 100_000;
  return `₹${lakhCrore.toLocaleString("en-IN", {
    maximumFractionDigits: lakhCrore < 10 ? 1 : 0,
  })}L`;
}

function GDPTooltip({ active, payload }: GDPTooltipProps) {
  const rawPoint = payload?.[0]?.payload;
  if (!active || !isGDPChartPoint(rawPoint)) return null;

  const point = rawPoint;

  return (
    <div className="chart-tooltip gdp-chart-tooltip">
      <strong>Nominal GDP</strong>
      <span>{point.year}</span>
      <div className="chart-tooltip-row">
        <span>GDP at current prices</span>
        <strong>
          {point.record.nominalGDP === null
            ? "—"
            : formatGDPExact(point.record.nominalGDP)}
        </strong>
      </div>
      <div className="chart-tooltip-row">
        <span>Revision</span>
        <strong>{point.record.revision}</strong>
      </div>
      <span className="gdp-tooltip-action">Click for details</span>
    </div>
  );
}

function getLatestRecord(points: GDPChartPoint[]) {
  return points.at(-1) ?? null;
}

export function GDPOverview({
  data,
}: {
  data: GDPOverviewData;
}) {
  const router = useRouter();
  const records = data.records;
  const chartData = data.nominalSeries;

  const latest = getLatestRecord(chartData);
  const maxValue = Math.max(0, ...chartData.map((point) => point.value));
  const yDomain: [number, number] = [0, maxValue > 0 ? maxValue * 1.14 : 1];
  const chartHeight = Math.min(400, Math.max(320, chartData.length * 22 + 260));
  const hasGDPData = records.length > 0;

  return (
    <section className="panel gdp-overview-panel" aria-labelledby="gdp-overview-title">
      <div className="panel-header">
        <div className="gdp-heading">
          <h2 className="panel-title" id="gdp-overview-title">
            GDP overview
          </h2>
          <p className="panel-subtitle">
            Official annual GDP · {records.length} observations
          </p>
        </div>
      </div>

      {!hasGDPData ? (
        <div className="empty-state gdp-unavailable">GDP data unavailable.</div>
      ) : (
        <>
          <div className="gdp-latest-summary">
            {latest ? (
              <>
                <div className="gdp-latest-value">
                  <span>
                    Latest nominal GDP · {latest.year}
                  </span>
                  <strong>{formatCroreCompact(latest.value)}</strong>
                </div>
                <div className="gdp-source-metadata">
                  <span>Source: MoSPI NAS</span>
                </div>
              </>
            ) : (
              <>
                <div className="gdp-latest-value">
                  <span>Latest nominal GDP</span>
                  <strong>—</strong>
                </div>
                <div className="gdp-source-metadata">
                  <span>Source: MoSPI NAS</span>
                </div>
              </>
            )}
          </div>

          {chartData.length > 0 ? (
            <div className="gdp-chart-frame">
              <p className="gdp-chart-unit">Nominal GDP · ₹ lakh crore</p>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  accessibilityLayer
                  aria-label="Nominal GDP by financial year"
                  data={chartData}
                  margin={{ top: 12, right: 12, bottom: chartData.length > 5 ? 32 : 12, left: 2 }}
                >
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "var(--chart-axis)",
                      fontSize: 10,
                    }}
                    interval={0}
                    angle={chartData.length > 5 ? -25 : 0}
                    textAnchor={chartData.length > 5 ? "end" : "middle"}
                    height={chartData.length > 5 ? 48 : 30}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "var(--chart-axis)",
                      fontSize: 9,
                    }}
                    tickFormatter={(value: number) => formatGDPAxis(Number(value))}
                    domain={yDomain}
                    width={64}
                  />
                  <Tooltip
                    content={<GDPTooltip />}
                    cursor={{ fill: "var(--surface-muted)" }}
                    offset={10}
                  />
                  <Bar
                    dataKey="value"
                    barSize={30}
                    isAnimationActive={false}
                    maxBarSize={34}
                    radius={[5, 5, 0, 0]}
                  >
                    {chartData.map((point) => {
                      return (
                        <Cell
                          key={point.year}
                          aria-label={`View GDP details for ${point.year}`}
                          cursor="pointer"
                          fill="var(--accent)"
                          onClick={() => {
                            router.push(`/gdp/${encodeURIComponent(point.year)}`);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              router.push(`/gdp/${encodeURIComponent(point.year)}`);
                            }
                          }}
                          role="link"
                          stroke="none"
                          strokeWidth={0}
                          tabIndex={0}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state gdp-unavailable">
              GDP data unavailable.
            </div>
          )}

        </>
      )}
    </section>
  );
}
