import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DepartmentDetailHeader } from "@/components/department-detail-header";
import { DepartmentSchemeBreakdown } from "@/components/department-scheme-breakdown";
import { DepartmentHistoryChart } from "@/components/yearly-budget-charts";
import {
  budgetRecords,
  getDepartment,
  getDepartmentHistory,
  getFinancialYears,
  getDepartments,
  getDepartmentSchemeBreakdown,
  getSchemesByYear,
} from "@/lib/budget-data";
import {
  buildYearTotals,
  getDepartmentRank,
  getDepartmentVolatility,
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
  searchParams: Promise<{ year?: string }>;
};

export function generateStaticParams() {
  const ids = new Set(budgetRecords.map((record) => record.id));
  return [...ids].map((id) => ({ id }));
}

async function DepartmentDetail({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const years = getFinancialYears().map((entry) => entry.year);
  const year =
    query.year && years.includes(query.year)
      ? query.year
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
  const departmentSchemes = getDepartmentSchemeBreakdown(id, year);
  const previousSchemes = previousYear ? getSchemesByYear(previousYear) : [];
  const yearTotals = buildYearTotals(budgetRecords, years);
  const rank = current ? getDepartmentRank(current, yearEntries) : null;
  const share =
    current && summary.total > 0
      ? calculateBudgetShare(current.amountCrore, summary.total)
      : null;
  const volatility = getDepartmentVolatility(history, years);
  const yoy = current && previous ? calculateYoY(current.amountCrore, previous.amountCrore) : null;
  const departmentOptions = [...new Map(
    budgetRecords.map((record) => [record.id, { id: record.id, name: record.department }]),
  ).values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="page-shell">
      <DepartmentDetailHeader
        departments={departmentOptions}
        selectedDepartmentId={id}
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

      <div className="detail-grid">
        <div className="detail-main">
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

        <aside className="detail-aside" aria-label="Department data notes">
          <article className="panel detail-stat">
            <span className="summary-label">Previous year</span>
            <strong className="summary-value">
              {previous ? formatCroreExact(previous.amountCrore) : "—"}
            </strong>
            <span className="summary-sub">
              {previousYear || "No previous financial year"}
              {current && previous
                ? ` · ${formatPercent(calculateYoY(current.amountCrore, previous.amountCrore))} YoY`
                : ""}
            </span>
          </article>
          <article className="panel detail-stat">
            <span className="summary-label">Ministry · selected year</span>
            <strong className="detail-ministry">{current?.ministry ?? latest.ministry}</strong>
          </article>
          <article className="panel detail-stat">
            <span className="summary-label">Year-to-year budget variation</span>
            <strong className="summary-value">{formatPercent(volatility)}</strong>
            <span className="summary-sub">
              Standard deviation of available annual percentage changes
            </span>
          </article>
        </aside>
      </div>

      <DepartmentSchemeBreakdown
        entries={departmentSchemes}
        previousEntries={previousSchemes}
        year={year}
        departmentTotal={current?.amountCrore ?? null}
        totalBudget={summary.total}
      />
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
