"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getPLFSData } from "@/lib/api/plfs";
import {
  PLFS_DEFAULT_FILTERS,
  PLFS_INDICATORS,
  type PLFSRecord,
} from "@/lib/types/plfs";

export default function PLFSOverviewChart() {
  const [records, setRecords] = useState<PLFSRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPLFSData({
      indicator_code: PLFS_INDICATORS.wpr,
      format: "JSON",
      limit: 100,
      page: 1,
      ...PLFS_DEFAULT_FILTERS,
    })
      .then((result) => {
        if (!cancelled) setRecords(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          console.error("PLFS API error:", cause);
          setError("Unable to load PLFS data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(
    () =>
      records
        .filter((record) => {
          const state = String(record.state ?? "").toLowerCase();
          const gender = String(record.gender ?? "").toLowerCase();
          return (
            (!state || state === "all india") &&
            (!gender || gender === "person")
          );
        })
        .map((record) => ({
          year: record.year ?? "",
          value: Number(record.value ?? record.rate),
        }))
        .filter((record) => record.year && Number.isFinite(record.value))
        .sort((first, second) => first.year.localeCompare(second.year)),
    [records],
  );

  return (
    <Link href="/public-participation">
      <section className="panel" aria-label="Worker Population Ratio">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Employment &amp; Public Participation</h2>
            <p className="panel-subtitle">Worker Population Ratio (WPR)</p>
          </div>
        </div>
        {loading ? (
          <div className="empty-chart">Loading PLFS data...</div>
        ) : error ? (
          <div className="empty-chart" role="alert">{error}</div>
        ) : data.length === 0 ? (
          <div className="empty-chart">No PLFS data available.</div>
        ) : (
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value: number) => `${value}%`} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "WPR"]} />
                <Bar dataKey="value" fill="var(--accent)" radius={[5, 5, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </Link>
  );
}
