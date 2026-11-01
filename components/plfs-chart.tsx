"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "@/lib/i18n/provider";

import { getPLFSData } from "@/lib/api/plfs";
import type { PLFSApiParams, PLFSRecord } from "@/lib/types/plfs";
import {
  PLFS_DEFAULT_FILTERS,
  PLFS_INDICATORS,
  PLFS_YEARS,
} from "@/lib/types/plfs";

type ChartState = {
  records: PLFSRecord[];
  loading: boolean;
  error: string | null;
};

function numericValue(record: PLFSRecord) {
  const value = record.value ?? record.rate;
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function yearOrder(year: string | null | undefined) {
  return Number(year?.slice(0, 4)) || 0;
}

function normalizedGender(record: PLFSRecord) {
  return String(record.gender ?? "").trim().toLowerCase();
}

function isPerson(record: PLFSRecord) {
  const gender = normalizedGender(record);
  return !gender || gender === "male" || gender === "female" ;
}

function isAllIndia(record: PLFSRecord) {
  const state = String(record.state ?? "").trim().toLowerCase();
  return !state || state === "all india";
}

function usePLFSRequest(params: PLFSApiParams): ChartState {
  const requestKey = JSON.stringify(params);
  const [records, setRecords] = useState<PLFSRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completedKey, setCompletedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const requestParams = JSON.parse(requestKey) as PLFSApiParams;

    getPLFSData(requestParams)
      .then((records) => {
        if (!cancelled) {
          setRecords(records);
          setError(null);
          setCompletedKey(requestKey);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          console.error("PLFS API error:", cause);
          setRecords([]);
          setError("Unable to load PLFS data.");
          setCompletedKey(requestKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  return {
    records,
    loading: completedKey !== requestKey,
    error: completedKey === requestKey ? error : null,
  };
}

function ChartMessage({
  state,
  empty,
}: {
  state: ChartState;
  empty: boolean;
}) {
  const { t } = useLanguage();
  if (state.loading) {
    return <div className="empty-chart">{t("Loading PLFS data...")}</div>;
  }
  if (state.error) {
    return (
      <div className="empty-chart" role="alert">
        {t(state.error)}
      </div>
    );
  }
  if (empty) return <div className="empty-chart">{t("No PLFS data available.")}</div>;
  return null;
}

function PercentageYAxis() {
  return (
    <YAxis
      tickFormatter={(value: number) => `${value}%`}
      domain={[0, "auto"]}
    />
  );
}

function filterRecords(
  records: PLFSRecord[],
  predicate: (record: PLFSRecord) => boolean,
) {
  return records
    .filter(predicate)
    .map((record) => ({
      ...record,
      value: numericValue(record),
    }))
    .filter(
      (record): record is typeof record & { value: number } =>
        record.value !== null,
    );
}

export default function PLFSCharts() {
  const { t } = useLanguage();
  const [stateYear, setStateYear] = useState("2023-24");
  const [stateGender, setStateGender] = useState("person");
  const [stateSector, setStateSector] = useState("rural + urban");
  const baseFilters = {
    ...PLFS_DEFAULT_FILTERS,
  };

  const unemployment = usePLFSRequest({
    indicator_code: PLFS_INDICATORS.unemployment,
    format: "JSON",
    limit: 100,
    page: 1,
    ...baseFilters,
  });
  const stateEmployment = usePLFSRequest({
    indicator_code: PLFS_INDICATORS.wpr,
    format: "JSON",
    year: stateYear,
    gender_code: 1,
    sector_code: stateSector,
    frequency_code: baseFilters.frequency_code,
    limit: 100,
    page: 1,
  });
  const lfpr = usePLFSRequest({
    indicator_code: PLFS_INDICATORS.lfpr,
    format: "JSON",
    gender_code: 1,
    limit: 100,
    page: 1,
    ...baseFilters,
  });

  const unemploymentData = useMemo(
    () =>
      filterRecords(
        unemployment.records,
        (record) => isAllIndia(record) && isPerson(record),
      ).sort(
        (first, second) =>
          yearOrder(first.year) - yearOrder(second.year),
      ),
    [unemployment.records],
  );
  const stateData = useMemo(
    () =>
      filterRecords(
        stateEmployment.records,
        (record) =>
          !record.state ||
          record.state.toLowerCase() !== "all india",
      ).sort((first, second) =>
        String(first.state).localeCompare(String(second.state)),
      ),
    [stateEmployment.records],
  );
  const lfprData = useMemo(() => {
    const records = filterRecords(lfpr.records, () => true);
    return PLFS_YEARS.map((year) => {
      const yearRecords = records.filter((record) => record.year === year);
      const male = yearRecords.find((record) =>
        normalizedGender(record) === "male",
      );
      const female = yearRecords.find((record) =>
        normalizedGender(record) === "female",
      );
      return {
        year,
        male: male?.value ?? null,
        female: female?.value ?? null,
      };
    }).filter((record) => record.male !== null || record.female !== null);
  }, [lfpr.records]);

  return (
    <div className="inflation-history-charts">
      <section className="panel" aria-label={t("Unemployment Rate vs Years")}>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">{t("Unemployment Rate vs Years")}</h2>
            <p className="panel-subtitle">{t("Annual PLFS unemployment rate")}</p>
          </div>
        </div>
        <ChartMessage state={unemployment} empty={unemploymentData.length === 0} />
        {!unemployment.loading && !unemployment.error && unemploymentData.length > 0 && (
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={unemploymentData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="year" />
                <PercentageYAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, t("Unemployment Rate")]} />
                <Bar dataKey="value" fill="var(--accent)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="panel" aria-label={t("State-wise Employment Percentage")}>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">{t("State-wise Employment Percentage")}</h2>
            <p className="panel-subtitle">{t("Worker Population Ratio (WPR)")}</p>
          </div>
          <div className="chart-controls">
            <select aria-label={t("Employment year")} value={stateYear} onChange={(event) => setStateYear(event.target.value)}>
              {PLFS_YEARS.slice().reverse().map((year) => <option key={year}>{year}</option>)}
            </select>
            <select aria-label={t("Employment gender")} value={stateGender} onChange={(event) => setStateGender(event.target.value)}>
              <option value="person">{t("Person")}</option>
              <option value="male">{t("Male")}</option>
              <option value="female">{t("Female")}</option>
            </select>
            <select aria-label={t("Employment sector")} value={stateSector} onChange={(event) => setStateSector(event.target.value)}>
              <option value="rural + urban">{t("Rural + Urban")}</option>
              <option value="rural">{t("Rural")}</option>
              <option value="urban">{t("Urban")}</option>
            </select>
          </div>
        </div>
        <ChartMessage state={stateEmployment} empty={stateData.length === 0} />
        {!stateEmployment.loading && !stateEmployment.error && stateData.length > 0 && (
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={stateData} margin={{ bottom: 40 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="state" angle={-35} textAnchor="end" interval={0} height={90} />
                <PercentageYAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "WPR"]} labelFormatter={(label) => `${label} · ${stateYear}`} />
                <Bar dataKey="value" fill="var(--accent)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="panel" aria-label={t("Labour Force Participation Rate")}>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">{t("Labour Force Participation Rate")}</h2>
            <p className="panel-subtitle">{t("Male vs Female · Annual PLFS")}</p>
          </div>
        </div>
        <ChartMessage state={lfpr} empty={lfprData.length === 0} />
        {!lfpr.loading && !lfpr.error && lfprData.length > 0 && (
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={lfprData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="year" />
                <PercentageYAxis />
                <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)}%`, t(name === "male" ? "Male" : "Female")]} />
                <Line dataKey="male" name={t("Male")} stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                <Line dataKey="female" name={t("Female")} stroke="var(--warning)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
