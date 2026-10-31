import inflationResponse from "@/data/inflation_output.json";

export type InflationRecord = {
  base_year: string;
  series: string;
  year: string;
  month: string;
  state: string;
  sector: string;
  division: string;
  group: string | null;
  class: string | null;
  sub_class: string | null;
  item: string | null;
  code: string | null;
  index: number | null;
  inflation: number | null;
  imputation: string | null;
};

const MONTH_ORDER: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value.trim() : String(value);
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = typeof value === "number" ? value : Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeInflationRecord(value: unknown): InflationRecord | null {
  if (!isObject(value)) return null;

  const year = asString(value.year);
  const month = asString(value.month);
  const state = asString(value.state);
  const sector = asString(value.sector);
  const division = asString(value.division);
  const inflation = parseFiniteNumber(value.inflation);
  const index = parseFiniteNumber(value.index);

  if (
    !/^\d{4}$/.test(year) ||
    !Object.hasOwn(MONTH_ORDER, month) ||
    !state ||
    !sector ||
    !division ||
    (inflation === null && index === null)
  ) {
    return null;
  }

  return {
    base_year: asString(value.base_year),
    series: asString(value.series),
    year,
    month,
    state,
    sector,
    division,
    group: asNullableString(value.group),
    class: asNullableString(value.class),
    sub_class: asNullableString(value.sub_class),
    item: asNullableString(value.item),
    code: asNullableString(value.code),
    index,
    inflation,
    imputation: asNullableString(value.imputation),
  };
}

function sortRecords(records: InflationRecord[]) {
  return [...records].sort(
    (a, b) =>
      Number(a.year) - Number(b.year) ||
      MONTH_ORDER[a.month] - MONTH_ORDER[b.month],
  );
}

const responseData = isObject(inflationResponse)
  ? inflationResponse.data
  : null;

const headlineInflationRecords = sortRecords(
  (Array.isArray(responseData) ? responseData : [])
    .map(normalizeInflationRecord)
    .filter((record): record is InflationRecord => record !== null)
    .filter(
      (record) =>
        record.state === "All India" &&
        record.sector === "Combined" &&
        record.division === "CPI (General)",
    ),
);

export function getHeadlineInflationRecords() {
  return headlineInflationRecords;
}

export function getInflationHistory() {
  return headlineInflationRecords.filter(
    (record) => record.inflation !== null,
  );
}

export function getCPIIndexHistory() {
  return headlineInflationRecords.filter((record) => record.index !== null);
}

export function getInflationRecord(year: string, month: string) {
  return (
    headlineInflationRecords.find(
      (record) => record.year === year && record.month === month,
    ) ?? null
  );
}

export function getLatestInflationRecord() {
  return (
    [...headlineInflationRecords]
      .reverse()
      .find((record) => record.inflation !== null) ?? null
  );
}

export function getLatestCPIIndexRecord() {
  return (
    [...headlineInflationRecords]
      .reverse()
      .find((record) => record.index !== null) ?? null
  );
}

export function getPreviousInflationRecord(year: string, month: string) {
  const index = headlineInflationRecords.findIndex(
    (record) => record.year === year && record.month === month,
  );

  for (let previous = index - 1; previous >= 0; previous -= 1) {
    const record = headlineInflationRecords[previous];
    if (record?.inflation !== null && record?.inflation !== undefined) {
      return record;
    }
  }

  return null;
}
