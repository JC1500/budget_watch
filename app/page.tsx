import { Suspense } from "react";
import Link from "next/link";
import {
  BudgetDistributionHistogram,
  BudgetChangeChart,
  DepartmentHeatmap,
  DepartmentHistoryChart,
  TotalBudgetTimeline,
} from "@/components/yearly-budget-charts";
import { BudgetRanking } from "@/components/budget-ranking";
import { BudgetTreemap } from "@/components/budget-treemap";
import { DepartmentTable } from "@/components/department-table";
import {
  budgetRecords,
  getBudgetsByYear,
  getDataStatus,
  getDepartments,
  getFinancialYears,
} from "@/lib/budget-data";
import { buildYearTotals, summarizeBudget } from "@/lib/analytics/budget";
import { formatCroreCompact, formatPercent, formatShare } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ year?: string }>;
};

function DashboardSkeleton() {
  return (
    <div className="summary-grid" aria-label="Loading budget dashboard">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="summary-card skeleton" key={index} />
      ))}
    </div>
  );
}

async function DashboardData({ searchParams }: PageProps) {
  const dataStatus = getDataStatus();
  if (dataStatus.errors.length > 0 || dataStatus.isEmpty) {
    return (
      <section className="panel error-state" role="alert">
        <h2>We couldn&apos;t load the budget data.</h2>
        <p>
          Check that valid JSON files are available in the project&apos;s{" "}
          <code>data/</code> folder, then try again.
        </p>
        <Link className="secondary-button" href="/">Retry</Link>
      </section>
    );
  }

  const query = await searchParams;
  const years = getFinancialYears().map((entry) => entry.year);
  const selectedYear =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";
  const selectedIndex = years.indexOf(selectedYear);
  const previousYear = selectedIndex > 0 ? years[selectedIndex - 1] : "";
  const entries = getDepartments(selectedYear);
  const previousEntries = getBudgetsByYear(previousYear);
  const summary = summarizeBudget(entries);
  const yearTotals = buildYearTotals(budgetRecords, years);
  const initialId = [...entries].sort(
    (a, b) => b.amountCrore - a.amountCrore,
  )[0]?.id ?? "";

  return (
    <>
      <section className="summary-grid" aria-label={`Budget summary for ${selectedYear}`}>
        <article className="summary-card">
          <span className="summary-label">Total budget</span>
          <strong className="summary-value">
            {formatCroreCompact(summary.total)}
          </strong>
          <span className="summary-sub">{selectedYear} · ₹ crore</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Departments</span>
          <strong className="summary-value">{summary.count.toLocaleString("en-IN")}</strong>
          <span className="summary-sub">With valid budget data</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Highest allocation</span>
          <strong className="summary-value">
            {summary.largest
              ? formatCroreCompact(summary.largest.amountCrore)
              : "—"}
          </strong>
          <span className="summary-sub">
            {summary.largest?.department ?? "No data"}
          </span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Median department budget</span>
          <strong className="summary-value">
            {summary.median === null
              ? "—"
              : formatCroreCompact(summary.median)}
          </strong>
          <span className="summary-sub">Middle allocation by department</span>
        </article>
      </section>

      <div className="dashboard-grid">
        <BudgetRanking entries={entries} />
        <section className="panel" aria-labelledby="year-insights-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="year-insights-title">
                Snapshot insights
              </h2>
              <p className="panel-subtitle">Calculated from {selectedYear} source rows</p>
            </div>
          </div>
          <div className="section-pad">
            <div className="snapshot-facts">
              <div>
                <span>Average department allocation</span>
                <strong>
                  {summary.average === null
                    ? "—"
                    : formatCroreCompact(summary.average)}
                </strong>
              </div>
              <div>
                <span>Top 5 departments&apos; share</span>
                <strong>{formatShare(summary.topFiveShare)}</strong>
              </div>
              <div>
                <span>Top 10 departments&apos; share</span>
                <strong>{formatShare(summary.topTenShare)}</strong>
              </div>
              <div>
                <span>Smallest department allocation</span>
                <strong>
                  {summary.smallest
                    ? formatCroreCompact(summary.smallest.amountCrore)
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Budget spread · standard deviation</span>
                <strong>
                  {summary.standardDeviation === null
                    ? "—"
                    : formatCroreCompact(summary.standardDeviation)}
                </strong>
              </div>
              <div>
                <span>Change in total vs {previousYear || "prior year"}</span>
                <strong>
                  {formatPercent(
                    yearTotals.find((item) => item.financialYear === selectedYear)?.yoy ??
                      null,
                  )}
                </strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <BudgetChangeChart
          currentEntries={entries}
          previousEntries={previousEntries}
          year={selectedYear}
        />
        <BudgetDistributionHistogram entries={entries} />
      </div>

      <div className="dashboard-grid">
        <BudgetTreemap entries={entries} />
        <TotalBudgetTimeline yearTotals={yearTotals} />
      </div>

      <DepartmentHistoryChart
        entries={budgetRecords}
        initialId={initialId}
        financialYears={years}
      />
      <DepartmentHeatmap records={budgetRecords} years={years} />
      <DepartmentTable
        entries={entries}
        previousEntries={previousEntries}
        allRecords={budgetRecords}
        years={years}
      />
    </>
  );
}

export default function Home(props: PageProps) {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Public finance · India</p>
          <h1>Budget Watch</h1>
          <p className="intro-copy">
            Explore how government budget allocations change across departments
            and financial years.
          </p>
        </div>
        <aside className="dataset-note" aria-label="Dataset status">
          <span className="status-dot" aria-hidden="true" />
          <span>
            <strong>Local JSON datasets.</strong> Financial years and allocations
            are read from the project&apos;s six data files.
          </span>
        </aside>
      </section>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData searchParams={props.searchParams} />
      </Suspense>
      <section className="data-footer-note">
        Amounts are shown in ₹ crore. Allocation changes describe budget
        movements only and do not imply performance or outcomes.
      </section>
    </main>
  );
}
