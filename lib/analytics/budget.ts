import type { BudgetEntry, SchemeBudgetEntry } from "@/lib/budget-data";
import {
  calculateCAGR,
  calculateMedian,
  calculateShare,
  calculateVolatility,
  calculateYoY,
} from "@/lib/format";

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function average(values: number[]) {
  const valid = values.filter(Number.isFinite);
  return valid.length === 0 ? null : sum(valid) / valid.length;
}

export function variance(values: number[]) {
  const valid = values.filter(Number.isFinite);
  const mean = average(valid);
  if (mean === null) return null;
  return sum(valid.map((value) => (value - mean) ** 2)) / valid.length;
}

export function standardDeviation(values: number[]) {
  const value = variance(values);
  return value === null ? null : Math.sqrt(value);
}

export function summarizeBudget(entries: BudgetEntry[]) {
  const amounts = entries
    .map((entry) => entry.amountCrore)
    .filter((amount) => Number.isFinite(amount) && amount >= 0);
  const total = sum(amounts);
  const sorted = [...entries].sort(
    (a, b) => b.amountCrore - a.amountCrore,
  );
  const mean = average(amounts);

  return {
    total,
    count: amounts.length,
    largest: sorted[0] ?? null,
    smallest: sorted.at(-1) ?? null,
    median: calculateMedian(amounts),
    average: mean,
    topFiveShare:
      total > 0
        ? calculateShare(
            sorted.slice(0, 5).reduce((sum, entry) => sum + entry.amountCrore, 0),
            total,
          )
        : null,
    topTenShare:
      total > 0
        ? calculateShare(
            sorted.slice(0, 10).reduce((sum, entry) => sum + entry.amountCrore, 0),
            total,
          )
        : null,
    standardDeviation: standardDeviation(amounts),
  };
}

export function populationStandardDeviation(values: number[]) {
  return standardDeviation(values);
}

export function buildYearTotals(
  records: BudgetEntry[],
  years: string[],
) {
  const totalsByYear = new Map<string, { total: number; departmentCount: number }>();
  for (const financialYear of years) {
    const uniqueEntries = new Map<string, BudgetEntry>();
    for (const entry of records) {
      if (
        entry.financialYear === financialYear &&
        Number.isFinite(entry.amountCrore) &&
        entry.amountCrore >= 0 &&
        !uniqueEntries.has(entry.id)
      ) {
        uniqueEntries.set(entry.id, entry);
      }
    }
    const entries = [...uniqueEntries.values()];
    const total = sum(entries.map((entry) => entry.amountCrore));
    totalsByYear.set(financialYear, {
      total,
      departmentCount: entries.length,
    });
  }

  return years.map((financialYear, index) => {
    const previousYear = index > 0 ? years[index - 1] : undefined;
    const currentTotals = totalsByYear.get(financialYear);
    const previousTotals = previousYear
      ? totalsByYear.get(previousYear)
      : undefined;
    return {
      financialYear,
      total: currentTotals?.total ?? 0,
      departmentCount: currentTotals?.departmentCount ?? 0,
      yoy:
        previousTotals === undefined
          ? null
          : calculateYoY(currentTotals?.total ?? 0, previousTotals.total),
    };
  });
}

export function getDepartmentRank(
  entry: BudgetEntry,
  entries: BudgetEntry[],
) {
  return (
    1 +
    entries.filter((candidate) => candidate.amountCrore > entry.amountCrore)
      .length
  );
}

export function getDepartmentCagr(
  history: BudgetEntry[],
  years: string[],
) {
  const available = years.flatMap((financialYear) => {
    const entry = history.find((candidate) => candidate.financialYear === financialYear);
    return entry ? [entry] : [];
  });
  const beginning = available[0];
  const ending = available.at(-1);
  if (!beginning || !ending || beginning === ending) return null;
  const periods =
    years.indexOf(ending.financialYear) -
    years.indexOf(beginning.financialYear);
  return calculateCAGR(
    beginning.amountCrore,
    ending.amountCrore,
    periods,
  );
}

export function getDepartmentVolatility(history: BudgetEntry[], years: string[]) {
  const changes = years.slice(1).flatMap((financialYear, index) => {
    const current = history.find((entry) => entry.financialYear === financialYear);
    const previous = history.find(
      (entry) => entry.financialYear === years[index],
    );
    if (!current || !previous) return [];
    const change = calculateYoY(current.amountCrore, previous.amountCrore);
    return change === null ? [] : [change];
  });
  return calculateVolatility(changes);
}

export function summarizeSchemes(entries: SchemeBudgetEntry[]) {
  const amounts = entries
    .map((entry) => entry.amountCrore)
    .filter(Number.isFinite);
  const total = sum(amounts);
  const sorted = [...entries].sort(
    (a, b) => b.amountCrore - a.amountCrore,
  );
  return {
    total,
    count: amounts.length,
    largest: sorted[0] ?? null,
    median: calculateMedian(amounts),
    average: average(amounts),
    standardDeviation: standardDeviation(amounts),
  };
}

export function getDepartmentSchemeRows(
  schemes: SchemeBudgetEntry[],
  financialYear: string,
  departmentAllocation: number | null,
) {
  const rowsById = new Map<
    string,
    {
      id: string;
      name: string;
      allocation: number | null;
      shareOfDepartment: number | null;
    }
  >();

  for (const scheme of schemes) {
    const row = rowsById.get(scheme.id) ?? {
      id: scheme.id,
      name: scheme.scheme,
      allocation: null,
      shareOfDepartment: null,
    };
    if (scheme.financialYear === financialYear) {
      row.allocation = scheme.amountCrore;
      row.shareOfDepartment =
        departmentAllocation === null || departmentAllocation <= 0
          ? null
          : calculateShare(scheme.amountCrore, departmentAllocation);
    }
    rowsById.set(scheme.id, row);
  }

  return [...rowsById.values()].sort((a, b) => {
    if (a.allocation === null) return b.allocation === null ? 0 : 1;
    if (b.allocation === null) return -1;
    return b.allocation - a.allocation;
  });
}

export function getSchemeRank(
  entry: SchemeBudgetEntry,
  entries: SchemeBudgetEntry[],
) {
  return 1 + entries.filter(
    (candidate) => candidate.amountCrore > entry.amountCrore,
  ).length;
}

export function getDepartmentSchemeRank(
  entry: SchemeBudgetEntry,
  entries: SchemeBudgetEntry[],
) {
  return 1 + entries.filter(
    (candidate) =>
      candidate.departmentId === entry.departmentId &&
      candidate.amountCrore > entry.amountCrore,
  ).length;
}

export function getSchemeCagr(
  history: SchemeBudgetEntry[],
  years: string[],
) {
  const available = years.flatMap((financialYear) => {
    const entry = history.find(
      (candidate) => candidate.financialYear === financialYear,
    );
    return entry ? [entry] : [];
  });
  const beginning = available[0];
  const ending = available.at(-1);
  if (!beginning || !ending || beginning === ending) return null;
  const periods =
    years.indexOf(ending.financialYear) -
    years.indexOf(beginning.financialYear);
  return calculateCAGR(beginning.amountCrore, ending.amountCrore, periods);
}

export function getSchemeVolatility(
  history: SchemeBudgetEntry[],
  years: string[],
) {
  const changes = years.slice(1).flatMap((financialYear, index) => {
    const current = history.find(
      (entry) => entry.financialYear === financialYear,
    );
    const previous = history.find(
      (entry) => entry.financialYear === years[index],
    );
    if (!current || !previous) return [];
    const change = calculateYoY(current.amountCrore, previous.amountCrore);
    return change === null ? [] : [change];
  });
  return calculateVolatility(changes);
}

export function buildYearSchemeTotals(
  records: SchemeBudgetEntry[],
  years: string[],
) {
  return years.map((financialYear) => {
    const yearRecords = records.filter(
      (entry) => entry.financialYear === financialYear,
    );
    return {
      financialYear,
      total: sum(yearRecords.map((entry) => entry.amountCrore)),
      schemeCount: yearRecords.length,
    };
  });
}
