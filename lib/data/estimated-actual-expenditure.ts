import source from "@/data/Estimated_vs_Actual_Expenditure.json";

export type EstimatedActualObservation = {
  financialYear: string;
  estimated: number;
  actual: number | null;
  variance: number | null;
  variancePercent: number | null;
};

export type EstimatedActualDataset = {
  unit: string;
  observations: EstimatedActualObservation[];
};

function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") return null;

  const normalized = value.replace(/[₹,\s]/g, "");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeEstimatedActualExpenditure(
  input: unknown,
): EstimatedActualDataset {
  const dataset = isRecord(input) ? input : {};
  const metadata = isRecord(dataset.metadata) ? dataset.metadata : {};
  const records = Array.isArray(dataset.data) ? dataset.data : [];
  const observations = records.flatMap((record): EstimatedActualObservation[] => {
    if (!isRecord(record) || typeof record.financial_year !== "string") {
      return [];
    }

    const financialYear = record.financial_year.trim();
    if (!/^\d{4}-\d{2}$/.test(financialYear)) return [];

    const estimated = parseAmount(record.estimated_expenditure);
    if (estimated === null) return [];

    const actual = parseAmount(record.actual_expenditure);
    const variance =
      actual === null ? null : actual - estimated;
    const variancePercent =
      actual === null || estimated === 0
        ? null
        : ((actual - estimated) / estimated) * 100;

    return [{
      financialYear,
      estimated,
      actual,
      variance,
      variancePercent:
        variancePercent !== null && Number.isFinite(variancePercent)
          ? variancePercent
          : null,
    }];
  });

  observations.sort(
    (left, right) =>
      Number(left.financialYear.slice(0, 4)) -
      Number(right.financialYear.slice(0, 4)),
  );

  const unit =
    typeof metadata.unit === "string"
      ? metadata.unit
      : "";

  return { unit, observations };
}

export function getEstimatedActualExpenditure(): EstimatedActualDataset {
  return normalizeEstimatedActualExpenditure(source);
}
