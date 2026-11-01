"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getGDPData } from "@/lib/api/gdp";
import type { GDPRecord } from "@/lib/types/gdp";

function parseValue(value: GDPRecord["current_price"]) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function GDPOverviewChart() {
  const [records, setRecords] = useState<GDPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getGDPData({
      base_year: "2022-23",
      series: "Current",
      frequency_code: "1",
      indicator_code: "5",
      account_code: "1",
    })
      .then((result) => {
        if (!cancelled) {
          setRecords(result);
        }
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        console.error("GDP API error:", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load GDP data.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = records
    .map((record) => ({
      year: record.year,
      value: parseValue(record.current_price),
      unit: record.unit,
    }))
    .filter(
      (record): record is typeof record & { value: number } =>
        record.value !== null,
    )
    .sort((first, second) =>
      first.year.localeCompare(second.year),
    );

  return (
    <section className="panel gdp-overview-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">National GDP</h2>
          <p className="panel-subtitle">
            Annual GDP at current prices
          </p>
        </div>
      </div>

      {loading ? (
        <div className="empty-chart">Loading GDP data...</div>
      ) : error ? (
        <div className="empty-chart" role="alert">
          {error}
        </div>
      ) : chartData.length === 0 ? (
        <div className="empty-chart">No GDP data available.</div>
      ) : (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid
                stroke="var(--chart-grid)"
                strokeDasharray="3 4"
                vertical={false}
              />
              <XAxis dataKey="year" />
              <YAxis
                tickFormatter={(value: number) =>
                  value.toLocaleString("en-IN")
                }
              />
              <Tooltip
                formatter={(value, _name, item) => [
                  Number(value).toLocaleString("en-IN"),
                  `GDP (${item.payload.unit})`,
                ]}
              />
              <Bar
                dataKey="value"
                name="GDP"
                fill="var(--accent)"
                radius={[5, 5, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
