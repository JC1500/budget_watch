"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getInflationData } from "@/lib/api/inflation";
import type { InflationRecord } from "@/lib/types/inflation";

type Metric = "index" | "inflation";

const ALL = "All";

function uniqueValues(
  records: InflationRecord[],
  getValue: (record: InflationRecord) => string | null | undefined
) {
  return [
    ...new Set(
      records
        .map(getValue)
        .filter((value): value is string => Boolean(value))
    ),
  ].sort();
}

// Updated: accepts string, number, null, or undefined.
function toNumber(
  value: string | number | null | undefined
): number | null {
  if (value == null || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function monthLabel(year: string, month: string) {
  const monthNumber = Number(month);

  if (monthNumber >= 1 && monthNumber <= 12) {
    const monthName = new Date(
      2000,
      monthNumber - 1,
      1
    ).toLocaleString("en-IN", {
      month: "short",
    });

    return `${monthName} ${year}`;
  }

  return `${year}-${month}`;
}

export default function CpiHierarchyChart() {
  const [records, setRecords] = useState<InflationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [division, setDivision] = useState(ALL);
  const [group, setGroup] = useState(ALL);
  const [classValue, setClassValue] = useState(ALL);
  const [subClass, setSubClass] = useState(ALL);
  const [item, setItem] = useState(ALL);

  const [metric, setMetric] = useState<Metric>("index");

  // Fetch CPI data using the existing API function.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
  try {
    setLoading(true);
    setError("");

    const response = await getInflationData({
      base_year: "2024",
      limit: 1000,
      page: 1,
    });

    if (!cancelled) {
      // getInflationData returns InflationRecord[] directly
      setRecords(response ?? []);
    }
  } catch (err) {
    console.error("Unable to load CPI data:", err);

    if (!cancelled) {
      setError("Unable to load CPI data. Please try again.");
    }
  } finally {
    if (!cancelled) {
      setLoading(false);
    }
  }
}

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Division options.
  const divisions = useMemo(
    () => uniqueValues(records, (record) => record.division),
    [records]
  );

  // Records filtered by division.
  const divisionRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          division === ALL || record.division === division
      ),
    [records, division]
  );

  // Group options.
  const groups = useMemo(
    () => uniqueValues(divisionRecords, (record) => record.group),
    [divisionRecords]
  );

  const groupRecords = useMemo(
    () =>
      divisionRecords.filter(
        (record) => group === ALL || record.group === group
      ),
    [divisionRecords, group]
  );

  // Class options.
  const classes = useMemo(
    () => uniqueValues(groupRecords, (record) => record.class),
    [groupRecords]
  );

  const classRecords = useMemo(
    () =>
      groupRecords.filter(
        (record) =>
          classValue === ALL || record.class === classValue
      ),
    [groupRecords, classValue]
  );

  // Sub-class options.
  const subClasses = useMemo(
    () => uniqueValues(classRecords, (record) => record.sub_class),
    [classRecords]
  );

  const subClassRecords = useMemo(
    () =>
      classRecords.filter(
        (record) =>
          subClass === ALL || record.sub_class === subClass
      ),
    [classRecords, subClass]
  );

  // Item options.
  const items = useMemo(
    () => uniqueValues(subClassRecords, (record) => record.item),
    [subClassRecords]
  );

  // Records matching all selected filters.
  const filteredRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          (division === ALL || record.division === division) &&
          (group === ALL || record.group === group) &&
          (classValue === ALL || record.class === classValue) &&
          (subClass === ALL || record.sub_class === subClass) &&
          (item === ALL || record.item === item)
      ),
    [records, division, group, classValue, subClass, item]
  );

  // Group records by year and month.
  // Multiple records in the same month are averaged.
  const chartData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        year: string;
        month: string;
        values: number[];
      }
    >();

    for (const record of filteredRecords) {
      const rawValue = record[metric];
      const value = toNumber(rawValue);

      if (value === null) continue;

      const key = `${record.year}-${record.month}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          year: record.year,
          month: record.month,
          values: [],
        });
      }

      grouped.get(key)!.values.push(value);
    }

    return [...grouped.entries()]
      .map(([key, entry]) => ({
        key,
        month: monthLabel(entry.year, entry.month),
        value:
          entry.values.reduce(
            (sum, current) => sum + current,
            0
          ) / entry.values.length,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredRecords, metric]);

  // Reset child filters when a parent selection changes.
  function resetChildren(
    level: "division" | "group" | "class" | "subClass"
  ) {
    if (level === "division") {
      setGroup(ALL);
      setClassValue(ALL);
      setSubClass(ALL);
      setItem(ALL);
    } else if (level === "group") {
      setClassValue(ALL);
      setSubClass(ALL);
      setItem(ALL);
    } else if (level === "class") {
      setSubClass(ALL);
      setItem(ALL);
    } else {
      setItem(ALL);
    }
  }

  const selectClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-1 block text-sm font-medium text-gray-600";

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
        Loading CPI data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">
          CPI Explorer
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Explore consumer price data by category and view its monthly trend.
        </p>
      </div>

      {/* Metric selector */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMetric("index")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            metric === "index"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          CPI Index
        </button>

        <button
          type="button"
          onClick={() => setMetric("inflation")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            metric === "inflation"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Inflation Rate
        </button>
      </div>

      {/* Hierarchy filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass}>Division</label>

          <select
            className={selectClass}
            value={division}
            onChange={(event) => {
              setDivision(event.target.value);
              resetChildren("division");
            }}
          >
            <option value={ALL}>All divisions</option>

            {divisions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Group</label>

          <select
            className={selectClass}
            value={group}
            disabled={groups.length === 0}
            onChange={(event) => {
              setGroup(event.target.value);
              resetChildren("group");
            }}
          >
            <option value={ALL}>All groups</option>

            {groups.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Class</label>

          <select
            className={selectClass}
            value={classValue}
            disabled={classes.length === 0}
            onChange={(event) => {
              setClassValue(event.target.value);
              resetChildren("class");
            }}
          >
            <option value={ALL}>All classes</option>

            {classes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Sub class</label>

          <select
            className={selectClass}
            value={subClass}
            disabled={subClasses.length === 0}
            onChange={(event) => {
              setSubClass(event.target.value);
              resetChildren("subClass");
            }}
          >
            <option value={ALL}>All sub classes</option>

            {subClasses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Item</label>

          <select
            className={selectClass}
            value={item}
            disabled={items.length === 0}
            onChange={(event) => setItem(event.target.value)}
          >
            <option value={ALL}>All items</option>

            {items.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart heading */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-800">
          {metric === "index"
            ? "CPI Index Trend"
            : "Inflation Rate Trend"}
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          {filteredRecords.length} matching records
        </p>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
          No chart data found for this selection.
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 16,
                left: 0,
                bottom: 4,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                minTickGap={20}
              />

              <YAxis
                tick={{ fontSize: 12 }}
                domain={["auto", "auto"]}
              />

              <Tooltip
                formatter={(value) => [
                  Number(value).toFixed(2),
                  metric === "index"
                    ? "CPI Index"
                    : "Inflation Rate",
                ]}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}