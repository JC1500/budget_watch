import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  DepartmentHistoryChart,
  DepartmentIndexedGrowthChart,
} from "@/components/yearly-budget-charts";
import {
  budgetRecords,
  getBudgetsByYear,
  getDepartment,
  getDepartmentHistory,
  getFinancialYears,
  getDepartments,
} from "@/lib/budget-data";
import {
  getDepartmentCagr,
  getDepartmentRank,
  getDepartmentVolatility,
  summarizeBudget,
} from "@/lib/analytics/budget";
import {
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
  const rank = current ? getDepartmentRank(current, yearEntries) : null;
  const share =
    current && summary.total > 0
      ? calculateShare(current.amountCrore, summary.total)
      : null;
  const cagr = getDepartmentCagr(history, years);
  const volatility = getDepartmentVolatility(history, years);
  const allYearTotals = new Map(
    years.map((financialYear) => {
      const entries = getBudgetsByYear(financialYear);
      return [
        financialYear,
        entries.reduce((sum, entry) => sum + entry.amountCrore, 0),
      ];
    }),
  );
  const indexedRows = history.flatMap((entry) => {
    const first = history[0];
    const firstTotal = allYearTotals.get(first.financialYear) ?? 0;
    const yearTotal = allYearTotals.get(entry.financialYear) ?? 0;
    if (first.amountCrore <= 0 || firstTotal <= 0) return [];
    return [{
      year: entry.financialYear,
      departmentIndex: (entry.amountCrore / first.amountCrore) * 100,
      overallIndex: (yearTotal / firstTotal) * 100,
    }];
  });

  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">
            <Link className="text-link" href={`/departments?year=${encodeURIComponent(year)}`}>Departments</Link>
            {" / "}Department detail
          </p>
          <h1>{latest.department}</h1>
          <p className="intro-copy">{current?.ministry ?? latest.ministry}</p>
        </div>
      </section>

      <section className="summary-grid" aria-label="Department summary">
        <article className="summary-card">
          <span className="summary-label">Budget · {year}</span>
          <strong className="summary-value">
            {current ? formatCroreExact(current.amountCrore) : "—"}
          </strong>
          <span className="summary-sub">
            {current ? "Listed allocation" : "No allocation row in this year"}
          </span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Rank · {year}</span>
          <strong className="summary-value">{rank === null ? "—" : `#${rank}`}</strong>
          <span className="summary-sub">Among departments in selected year</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Share of selected total</span>
          <strong className="summary-value">{formatShare(share)}</strong>
          <span className="summary-sub">Share of department allocations</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">CAGR · available history</span>
          <strong className="summary-value">{formatPercent(cagr)}</strong>
          <span className="summary-sub">Annualized change between endpoints</span>
        </article>
      </section>

      <div className="detail-grid">
        <div className="detail-main">
          <DepartmentHistoryChart
            entries={budgetRecords}
            initialId={id}
            financialYears={years}
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
          <section className="panel" aria-labelledby="indexed-growth-title">
            <div className="panel-header">
              <div>
                <h2 className="panel-title" id="indexed-growth-title">
                  Indexed growth vs overall budget
                </h2>
                <p className="panel-subtitle">
                  First available common year = 100 · index, not ₹ crore
                </p>
              </div>
            </div>
            <DepartmentIndexedGrowthChart rows={indexedRows} />
            {indexedRows.length > 1 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Financial year</th>
                      <th className="numeric" scope="col">Department index</th>
                      <th className="numeric" scope="col">Overall index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexedRows.map((row) => (
                      <tr key={row.year}>
                        <td>{row.year}</td>
                        <td className="numeric">{row.departmentIndex.toFixed(1)}</td>
                        <td className="numeric">{row.overallIndex.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-chart">Indexed growth requires at least two comparable years.</div>
            )}
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
          <div className="dataset-note">
            <span className="status-dot" aria-hidden="true" />
            <span>Historical names are matched conservatively; uncertain label changes remain separate.</span>
          </div>
        </aside>
      </div>
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
