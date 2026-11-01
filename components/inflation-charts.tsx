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
import { useLanguage } from "@/lib/i18n/provider";
import {
  CPI_BASE_YEAR,
  MONTHS,
  type InflationApiParams,
  type InflationRecord,
} from "@/lib/types/inflation";

type Variant = "All-India" | "State-wise" | "Sector-wise";

type StateOption = {
  name: string;
  code: string;
};

type InflationChartProps = {
  variant: Variant;
  states?: StateOption[];
  sectors?: { name: string; code: string }[];
  params?: InflationApiParams;
};

const MONTH_ORDER = new Map<string, number>(
  MONTHS.map((month, index) => [month, index + 1]),
);

function numericValue(value: InflationRecord["inflation"]) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function InflationChart({
  variant,
  states = [],
  sectors = [],
  params,
}: InflationChartProps) {
  const { t } = useLanguage();
  const [records, setRecords] = useState<InflationRecord[]>([]);
  const [selectedState, setSelectedState] = useState(
    states[0]?.name ?? "",
  );
  const [selectedSector, setSelectedSector] = useState(
    sectors[0]?.code ?? "3",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Extract individual values to avoid depending on the params object.
  const year = params?.year;
  const monthCode = params?.month_code;
  const stateCode = params?.state_code;
  const sectorCode = params?.sector_code;
  const divisionCode = params?.division_code;
  const groupCode = params?.group_code;
  const classCode = params?.class_code;
  const subClassCode = params?.sub_class_code;
  const itemCode = params?.item_code;
  const limit = params?.limit;
  const page = params?.page;
  const stateOptions = useMemo(() => {
    const options = new Map(
      states.map((state) => [state.name, state]),
    );

    for (const record of records) {
      if (record.state && !options.has(record.state)) {
        options.set(record.state, {
          name: record.state,
          code: record.state,
        });
      }
    }

    return [...options.values()];
  }, [records, states]);
  const activeState =
    stateOptions.some((state) => state.name === selectedState)
      ? selectedState
      : stateOptions[0]?.name ?? "";

  const selectedRecords = records.filter((record) =>
    variant === "All-India"
      ? record.state === "All India"
      : variant === "State-wise"
        ? record.state === activeState
        : true,
  );

  const validRecords = selectedRecords.flatMap((record) => {
    const inflation = numericValue(record.inflation);
    return inflation === null ? [] : [{ record, inflation }];
  });

  const latestYear = validRecords.reduce(
    (latest, { record }) => Math.max(latest, Number(record.year)),
    0,
  );

  const chartData = validRecords
    .filter(({ record }) => Number(record.year) === latestYear)
    .map(({ record, inflation }) => ({
      month: record.month,
      monthNumber: MONTH_ORDER.get(record.month) ?? 0,
      inflation,
    }))
    .sort((a, b) => a.monthNumber - b.monthNumber);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const apiParams: InflationApiParams = {
          base_year: CPI_BASE_YEAR,
          year,
          month_code: monthCode,
          state_code: variant === "Sector-wise" ? stateCode : undefined,
          sector_code:
            variant === "Sector-wise"
              ? selectedSector
              : sectorCode,
          division_code: divisionCode,
          group_code: groupCode,
          class_code: classCode,
          sub_class_code: subClassCode,
          item_code: itemCode,
          limit,
          page,
        };

        const response = await getInflationData(apiParams);

        if (!cancelled) {
          setRecords(response);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setRecords([]);
          setError("Unable to load CPI data.");
          console.error("CPI API error:", cause);
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
  }, [
    variant,
    selectedSector,
    year,
    monthCode,
    stateCode,
    sectorCode,
    divisionCode,
    groupCode,
    classCode,
    subClassCode,
    itemCode,
    limit,
    page,
  ]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{t("CPI Inflation Trend")}</h2>
          <p className="text-sm text-muted">{t("Base Year")}: 2024</p>
        </div>

        {variant === "State-wise" && (
          <select
            value={activeState}
            onChange={(event) => setSelectedState(event.target.value)}
            className="chart-select"
          >
            {stateOptions.map((state) => (
              <option key={state.name} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>
        )}

        {variant === "Sector-wise" && (
          <select
            value={selectedSector}
            onChange={(event) => setSelectedSector(event.target.value)}
            className="chart-select"
          >
            {sectors.map((sector) => (
              <option key={sector.code} value={sector.code}>
                {sector.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="chart-container">
        {loading ? (
          <p className="chart-message">{t("Loading CPI data...")}</p>
        ) : error ? (
          <p className="chart-message">{t(error)}</p>
        ) : chartData.length === 0 ? (
          <p className="chart-message">{t("No CPI data available.")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tickFormatter={(month) => month.slice(0, 3)}
              />

              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={["auto", "auto"]}
              />

              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(2)}%`,
                  t("Inflation"),
                ]}
              />

              <Line
                type="monotone"
                dataKey="inflation"
                stroke="#17634d"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}