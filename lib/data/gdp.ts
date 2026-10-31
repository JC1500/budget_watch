import gdpResponse from "@/data/gdp_output.json";

type RawGDPRecord = {
  base_year?: unknown;
  series?: unknown;
  year?: unknown;
  indicator?: unknown;
  frequency?: unknown;
  revision?: unknown;
  quarter?: unknown;
  current_price?: unknown;
  constant_price?: unknown;
  unit?: unknown;
};

export type NormalizedGDPRecord = {
  year: string;
  nominalGDP: number | null;
  realGDP: number | null;
  indicator: string;
  frequency: string;
  revision: string;
  baseYear: string;
  series: string;
  unit: string;
};

export type GDPMetric = "nominal" | "real" | "growth";

export type RealGDPGrowthRecord = {
  year: string;
  value: number;
  record: NormalizedGDPRecord;
  previousYear: string;
  previousRealGDP: number;
  growthPercent: number;
};

export type GDPSeriesRecord = {
  year: string;
  value: number;
  record: NormalizedGDPRecord;
  previousYear?: string;
  previousRealGDP?: number;
  growthPercent?: number;
};

export type GDPDetailRecord = {
  record: NormalizedGDPRecord;
  previousRecord: NormalizedGDPRecord | null;
  growthPercent: number | null;
  nominalGrowthPercent: number | null;
};

export type GDPMethodology = {
  source: string;
  sourceReference: string;
  indicator: string;
  explanations: Record<GDPMetric, string>;
};

export type GDPOverviewData = {
  records: NormalizedGDPRecord[];
  nominalSeries: GDPSeriesRecord[];
  realSeries: GDPSeriesRecord[];
  growthSeries: RealGDPGrowthRecord[];
  details: GDPDetailRecord[];
  methodology: GDPMethodology;
};

const GDP_METHODOLOGY: GDPMethodology = {
  source: "MoSPI National Accounts Statistics",
  sourceReference:
    "https://api.mospi.gov.in/api/nas/getNASData?base_year=2022-23&series=Current&frequency_code=Annually&indicator_code=5&Format=JSON",
  indicator: "Gross Domestic Product",
  explanations: {
    nominal:
      "Nominal GDP represents GDP measured at current prices. The application uses the current_price field from the GDP source.",
    real:
      "Real GDP uses constant-price GDP so changes over time are less affected by changing price levels. The application uses the constant_price field from the GDP dataset.",
    growth:
      "Real GDP Growth compares current constant-price GDP with the previous comparable financial year: ((current constant-price GDP / previous constant-price GDP) - 1) × 100.",
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFiniteNonNegativeNumber(value: unknown): number | null {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value.trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getFinancialYearStart(year: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(year);
  return match ? Number(match[1]) : null;
}

function getRevisionPriority(revision: string) {
  const normalized = revision.toLocaleLowerCase("en-IN");
  // Prefer the latest known NAS revision stage; equal or unknown stages keep source order.
  const orderedRevisions = [
    "first advance estimates",
    "second advance estimates",
    "provisional estimates",
    "first revised estimates",
    "second revised estimates",
    "third revised estimates",
  ];

  return orderedRevisions.indexOf(normalized);
}

function normalizeGDPRecord(value: unknown): NormalizedGDPRecord | null {
  if (!isObject(value)) return null;
  const raw = value as RawGDPRecord;
  const year = typeof raw.year === "string" ? raw.year.trim() : "";
  const unit = typeof raw.unit === "string" ? raw.unit.trim() : "";
  const indicator =
    typeof raw.indicator === "string" ? raw.indicator.trim() : "";
  const frequencyValue =
    typeof raw.frequency === "string" ? raw.frequency.trim() : "";
  const frequency = frequencyValue.toLocaleLowerCase("en-IN");

  if (
    getFinancialYearStart(year) === null ||
    !["annual", "annually"].includes(frequency) ||
    (raw.quarter != null && raw.quarter !== "") ||
    (indicator && !/gross domestic product/i.test(indicator)) ||
    !/crore/i.test(unit)
  ) {
    return null;
  }

  const nominalGDP = parseFiniteNonNegativeNumber(raw.current_price);
  const realGDP = parseFiniteNonNegativeNumber(raw.constant_price);
  if (nominalGDP === null && realGDP === null) return null;

  return {
    year,
    nominalGDP,
    realGDP,
    indicator: indicator || "Unavailable",
    frequency: frequencyValue || "Unavailable",
    revision:
      typeof raw.revision === "string" && raw.revision.trim()
        ? raw.revision.trim()
        : "Unavailable",
    baseYear:
      typeof raw.base_year === "string" && raw.base_year.trim()
        ? raw.base_year.trim()
        : "Unavailable",
    series:
      typeof raw.series === "string" && raw.series.trim()
        ? raw.series.trim()
        : "Unavailable",
    unit,
  };
}

function buildGDPRecords() {
  const responseData: unknown = isObject(gdpResponse) ? gdpResponse.data : null;
  if (!Array.isArray(responseData)) return [];

  const recordsByYear = new Map<string, NormalizedGDPRecord>();

  for (const rawRecord of responseData) {
    const record = normalizeGDPRecord(rawRecord);
    if (!record) continue;

    const existing = recordsByYear.get(record.year);
    if (
      !existing ||
      getRevisionPriority(record.revision) > getRevisionPriority(existing.revision)
    ) {
      recordsByYear.set(record.year, record);
    }
  }

  return [...recordsByYear.values()].sort(
    (a, b) =>
      (getFinancialYearStart(a.year) ?? 0) -
      (getFinancialYearStart(b.year) ?? 0),
  );
}

const annualGDPRecords = buildGDPRecords();

export function getGDPRecords() {
  return annualGDPRecords;
}

export function getGDPRecordByYear(
  year: string,
  records = annualGDPRecords,
) {
  return records.find((record) => record.year === year) ?? null;
}

export function getPreviousGDPRecord(
  year: string,
  records = annualGDPRecords,
) {
  const currentYearStart = getFinancialYearStart(year);
  if (currentYearStart === null) return null;
  const previousYear = `${currentYearStart - 1}-${String(
    currentYearStart % 100,
  ).padStart(2, "0")}`;
  return getGDPRecordByYear(previousYear, records);
}

export function calculateRealGDPGrowth(
  year: string,
  records = annualGDPRecords,
) {
  const record = getGDPRecordByYear(year, records);
  if (!record) return null;

  const previousRecord = getPreviousGDPRecord(year, records);
  let growthPercent: number | null = null;
  if (
    previousRecord &&
    record.baseYear !== "Unavailable" &&
    record.baseYear === previousRecord.baseYear &&
    record.series !== "Unavailable" &&
    record.series === previousRecord.series &&
    previousRecord.realGDP !== null &&
    previousRecord.realGDP > 0 &&
    record.realGDP !== null
  ) {
    growthPercent = ((record.realGDP / previousRecord.realGDP) - 1) * 100;
  }

  return {
    record,
    previousRecord,
    growthPercent: growthPercent !== null && Number.isFinite(growthPercent)
      ? growthPercent
      : null,
  };
}

export function calculateNominalGDPGrowth(
  year: string,
  records = annualGDPRecords,
) {
  const record = getGDPRecordByYear(year, records);
  if (!record) return null;

  const previousRecord = getPreviousGDPRecord(year, records);
  let growthPercent: number | null = null;
  if (
    previousRecord &&
    record.baseYear !== "Unavailable" &&
    record.baseYear === previousRecord.baseYear &&
    record.series !== "Unavailable" &&
    record.series === previousRecord.series &&
    previousRecord.nominalGDP !== null &&
    previousRecord.nominalGDP > 0 &&
    record.nominalGDP !== null
  ) {
    growthPercent =
      ((record.nominalGDP / previousRecord.nominalGDP) - 1) * 100;
  }

  return growthPercent !== null && Number.isFinite(growthPercent)
    ? growthPercent
    : null;
}

export function getGDPExplanation(metric: GDPMetric) {
  return GDP_METHODOLOGY.explanations[metric];
}

export function getNominalGDPSeries(records = annualGDPRecords) {
  return records.flatMap((record) =>
    record.nominalGDP === null
      ? []
      : [{ year: record.year, record, value: record.nominalGDP }],
  );
}

export function getRealGDPSeries(records = annualGDPRecords) {
  return records.flatMap((record) =>
    record.realGDP === null
      ? []
      : [{ year: record.year, record, value: record.realGDP }],
  );
}

export function getNominalGDPGrowthSeries(records = annualGDPRecords) {
  return records.flatMap((record) => {
    const growthPercent = calculateNominalGDPGrowth(record.year, records);
    return growthPercent === null
      ? []
      : [{ year: record.year, record, value: growthPercent, growthPercent }];
  });
}

export function getRealGDPGrowthSeries(records = annualGDPRecords) {
  const realRecords = getRealGDPSeries(records);

  return realRecords.flatMap(({ record }) => {
    const calculation = calculateRealGDPGrowth(record.year, records);
    if (
      !calculation?.previousRecord ||
      calculation.growthPercent === null ||
      calculation.previousRecord.realGDP === null
    ) return [];

    return [
      {
        year: record.year,
        value: calculation.growthPercent,
        record,
        previousYear: calculation.previousRecord.year,
        previousRealGDP: calculation.previousRecord.realGDP,
        growthPercent: calculation.growthPercent,
      },
    ];
  });
}

export function getGDPOverviewData(): GDPOverviewData {
  const records = getGDPRecords();
  const details = records.map((record) => {
    const calculation = calculateRealGDPGrowth(record.year, records);
    return {
      record,
      previousRecord: calculation?.previousRecord ?? null,
      growthPercent: calculation?.growthPercent ?? null,
      nominalGrowthPercent: calculateNominalGDPGrowth(record.year, records),
    };
  });

  return {
    records,
    nominalSeries: getNominalGDPSeries(records),
    realSeries: getRealGDPSeries(records),
    growthSeries: getRealGDPGrowthSeries(records),
    details,
    methodology: GDP_METHODOLOGY,
  };
}
