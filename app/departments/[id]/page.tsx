import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DepartmentDetailHeader } from "@/components/department-detail-header";
import { DepartmentSchemeList } from "@/components/department-scheme-list";
import { SchemeBudgetAnalysis } from "@/components/scheme-budget-analysis";
import { DepartmentHistoryChart } from "@/components/yearly-budget-charts";
import {
  budgetRecords,
  getDepartment,
  getDepartmentHistory,
  getFinancialYears,
  getDepartments,
  getSchemesByDepartment,
} from "@/lib/budget-data";
import {
  buildYearTotals,
  getDepartmentRank,
  getDepartmentSchemeRows,
  summarizeBudget,
} from "@/lib/analytics/budget";
import {
  calculateBudgetShare,
  calculateShare,
  calculateYoY,
  formatCroreExact,
  formatPercent,
  formatShare,
} from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  const ids = new Set(budgetRecords.map((record) => record.id));
  return [...ids].map((id) => ({ id }));
}

async function DepartmentDetail({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const years = getFinancialYears().map((entry) => entry.year);
  const requestedYear = typeof query.year === "string" ? query.year : undefined;
  const requestedScheme = typeof query.scheme === "string" ? query.scheme : undefined;
  const year =
    requestedYear && years.includes(requestedYear)
      ? requestedYear
      : years.at(-1) ?? "";
  const history = getDepartmentHistory(id);
  const latest = getDepartment(id);
  if (!latest) notFound();

  const current = history.find((entry) => entry.financialYear === year);
  const yearIndex = years.indexOf(year);
  const previousYear = yearIndex > 0 ? years[yearIndex - 1] : "";
  const previous = history.find((entry) => entry.financialYear === previousYear);
  const yearEntries = getDepartments(year);
  const summary = summarizeBudget(yearEntries);
  const departmentSchemes = getSchemesByDepartment(id);
  const departmentSchemeRows = getDepartmentSchemeRows(
    departmentSchemes,
    year,
    current?.amountCrore ?? null,
  );
  const selectedSchemeId = departmentSchemes.some((scheme) => scheme.id === requestedScheme)
    ? requestedScheme ?? ""
    : "";
  const selectedSchemeHistory = selectedSchemeId
    ? departmentSchemes
        .filter((scheme) => scheme.id === selectedSchemeId)
        .sort((a, b) => a.financialYear.localeCompare(b.financialYear))
    : [];
  const selectedSchemeCurrent = selectedSchemeHistory.find(
    (scheme) => scheme.financialYear === year,
  );
  const yearTotals = buildYearTotals(budgetRecords, years);
  const rank = current ? getDepartmentRank(current, yearEntries) : null;
  const share =
    current && summary.total > 0
      ? calculateBudgetShare(current.amountCrore, summary.total)
      : null;
  const selectedYearTotal = yearTotals.find((entry) => entry.financialYear === year)?.total;
  const yoy = current && previous ? calculateYoY(current.amountCrore, previous.amountCrore) : null;
  const departmentOptions = [...new Map(
    budgetRecords.map((record) => [record.id, { id: record.id, name: record.department }]),
  ).values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="page-shell">
      <DepartmentDetailHeader
        departments={departmentOptions}
        selectedDepartmentId={id}
        selectedSchemeId={selectedSchemeId}
        selectedYear={year}
        years={years}
      />

      <section className="detail-summary-strip" aria-label="Department summary">
        <div className="detail-metric">
          <span className="detail-metric-label">Allocation</span>
          <strong className="detail-metric-value">
            {current ? formatCroreExact(current.amountCrore) : "—"}
          </strong>
          <small className="detail-metric-note">{year}</small>
        </div>
        <div className="detail-metric">
          <span className="detail-metric-label">Share of total budget</span>
          <strong className="detail-metric-value">{formatShare(share)}</strong>
          <small className="detail-metric-note">Selected year total</small>
        </div>
        <div className="detail-metric">
          <span className="detail-metric-label">YoY change</span>
          <strong className="detail-metric-value">{formatPercent(yoy)}</strong>
          <small className="detail-metric-note">vs {previousYear || "prior year"}</small>
        </div>
        <div className="detail-metric">
          <span className="detail-metric-label">Budget rank</span>
          <strong className="detail-metric-value">{rank === null ? "—" : `#${rank}`}</strong>
          <small className="detail-metric-note">{year}</small>
        </div>
      </section>

      <div className="detail-main department-analysis-flow">
        <DepartmentHistoryChart
          key={id}
          entries={budgetRecords}
          initialId={id}
          financialYears={years}
          yearTotals={yearTotals}
          selectedYear={year}
          enableViewSelector
          locked
        />
        <section className="panel" aria-labelledby="annual-growth-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="annual-growth-title">
                Year-by-year budget
              </h2>
              <p className="panel-subtitle">Budget changes and share · ₹ crore</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Financial year</th>
                  <th className="numeric" scope="col">Budget</th>
                  <th className="numeric" scope="col">Absolute change</th>
                  <th className="numeric" scope="col">YoY %</th>
                  <th className="numeric" scope="col">Share of total</th>
                  <th className="numeric" scope="col">Rank</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => {
                  const yearPosition = years.indexOf(entry.financialYear);
                  const oldYear = yearPosition > 0 ? years[yearPosition - 1] : undefined;
                  const old = oldYear
                    ? history.find((candidate) => candidate.financialYear === oldYear)
                    : undefined;
                  const yearSummary = summarizeBudget(getDepartments(entry.financialYear));
                  const yearRank = getDepartmentRank(entry, getDepartments(entry.financialYear));
                  return (
                    <tr key={entry.financialYear}>
                      <td>{entry.financialYear}</td>
                      <td className="numeric">{formatCroreExact(entry.amountCrore)}</td>
                      <td className="numeric">
                        {old
                          ? formatCroreExact(entry.amountCrore - old.amountCrore)
                          : "—"}
                      </td>
                      <td className="numeric">
                        {formatPercent(old ? calculateYoY(entry.amountCrore, old.amountCrore) : null)}
                      </td>
                      <td className="numeric">
                        {formatShare(calculateShare(entry.amountCrore, yearSummary.total))}
                      </td>
                      <td className="numeric">#{yearRank}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <DepartmentSchemeList
        departmentId={id}
        ministry={current?.ministry ?? latest.ministry}
        rows={departmentSchemeRows}
        selectedSchemeId={selectedSchemeId}
        selectedYear={year}
      />

      {selectedSchemeId && (
        <SchemeBudgetAnalysis
          history={selectedSchemeHistory}
          years={years}
          selectedYear={year}
          departmentHistory={history}
          yearTotals={yearTotals}
          showDepartmentShare={false}
          selectedYearSummary={{
            schemeName: selectedSchemeCurrent?.scheme ?? selectedSchemeHistory.at(-1)?.scheme ?? "",
            departmentName: selectedSchemeCurrent?.department ?? latest.department,
            allocation: selectedSchemeCurrent?.amountCrore ?? null,
            shareOfTotal:
              selectedSchemeCurrent && selectedYearTotal
                ? calculateShare(selectedSchemeCurrent.amountCrore, selectedYearTotal)
                : null,
          }}
        />
      )}
    </main>
  );
}

export default function DepartmentDetailPage(props: Props) {
  return (
    <Suspense fallback={<main className="page-shell"><div className="panel skeleton table-skeleton" /></main>}>
      <DepartmentDetail params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
