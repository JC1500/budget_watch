import { Suspense } from "react";
import Link from "next/link";
import {
  DepartmentHeatmap,
  DepartmentHistoryChart,
  TotalBudgetTimeline,
} from "@/components/yearly-budget-charts";
import { InflationOverviewChart } from "@/components/inflation-charts";
import { BudgetCategoryChart } from "@/components/budget-category-chart";
import { GDPOverview } from "@/components/gdp-overview";
import {
  budgetRecords,
  getDataStatus,
  getDepartments,
  getFinancialYears,
} from "@/lib/budget-data";
import { buildYearTotals, summarizeBudget } from "@/lib/analytics/budget";
import { getBudgetCategorySummaries } from "@/lib/data/categories";
import { getGDPOverviewData } from "@/lib/data/gdp";
import { getHeadlineInflationRecords } from "@/lib/data/inflation";
import { formatCroreCompact } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ year?: string; level?: string }>;
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
  const entries = getDepartments(selectedYear);
  const summary = summarizeBudget(entries);
  const yearTotals = buildYearTotals(budgetRecords, years);
  const initialId = [...entries].sort(
    (a, b) => b.amountCrore - a.amountCrore,
  )[0]?.id ?? "";
  const gdpData = getGDPOverviewData();

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

      <div className="overview-analysis-row">
        <section className="panel overview-major-category-panel">
          <BudgetCategoryChart
            categories={getBudgetCategorySummaries(selectedYear)}
            selectedYear={selectedYear}
          />
        </section>
        <GDPOverview data={gdpData} />
      </div>

      <div className="overview-flow">
        <InflationOverviewChart records={getHeadlineInflationRecords()} />
        <TotalBudgetTimeline yearTotals={yearTotals} />
        <DepartmentHistoryChart
          entries={budgetRecords}
          initialId={initialId}
          financialYears={years}
          yearTotals={yearTotals}
          selectedYear={selectedYear}
        />
        <DepartmentHeatmap records={budgetRecords} years={years} />
      </div>
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
            Explore how government budgets flow from departments into schemes
            and change across financial years.
          </p>
        </div>
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
