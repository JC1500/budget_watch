import { BudgetRanking } from "@/components/budget-ranking";
import { BudgetOverTime } from "@/components/budget-over-time";
import { BudgetTreemap } from "@/components/budget-treemap";
import { DepartmentTable } from "@/components/department-table";
import { budgetEntries, totalBudgetCrore } from "@/lib/budget-data";
import {
  calculateMedian,
  formatCroreCompact,
  formatCroreExact,
} from "@/lib/format";

const sortedEntries = [...budgetEntries].sort(
  (a, b) => b.amountCrore - a.amountCrore,
);
const highestAllocation = sortedEntries[0];
const medianAllocation = calculateMedian(
  budgetEntries.map((entry) => entry.amountCrore),
);

export default function Home() {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Public finance · India</p>
          <h1>Budget Watch</h1>
          <p className="intro-copy">
            Understand how government budget allocations are distributed across
            departments.
          </p>
        </div>
        <aside className="dataset-note" aria-label="Dataset status">
          <span className="status-dot" aria-hidden="true" />
          <span>
            <strong>Preview data.</strong> The period and official source have not
            been provided yet.
          </span>
        </aside>
      </section>

      <section className="summary-grid" aria-label="Snapshot summary">
        <article className="summary-card">
          <span className="summary-label">Departments with allocation</span>
          <strong className="summary-value">
            {budgetEntries.length.toLocaleString("en-IN")}
          </strong>
          <span className="summary-sub">In the supplied snapshot</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Total allocation</span>
          <strong className="summary-value">{formatCroreCompact(totalBudgetCrore)}</strong>
          <span className="summary-sub">Sum of listed department amounts</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Largest allocation</span>
          <strong className="summary-value">
            {formatCroreCompact(highestAllocation.amountCrore)}
          </strong>
          <span className="summary-sub">{highestAllocation.department}</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Median department budget</span>
          <strong className="summary-value">
            {medianAllocation == null ? "—" : formatCroreCompact(medianAllocation)}
          </strong>
          <span className="summary-sub">Median of listed allocations</span>
        </article>
      </section>

      <div className="dashboard-grid">
        <BudgetRanking entries={budgetEntries} />
        <section className="panel" aria-labelledby="snapshot-note-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="snapshot-note-title">Reading this snapshot</h2>
              <p className="panel-subtitle">What the current data includes</p>
            </div>
          </div>
          <div className="section-pad">
            <p className="intro-copy">
              Values below are shown exactly as provided, in crore rupees. This
              preview has one allocation per department and no financial-year
              label.
            </p>
            <div className="snapshot-facts">
              <div>
                <span>Top listed allocation</span>
                <strong>{highestAllocation.department}</strong>
                <small>{formatCroreExact(highestAllocation.amountCrore)}</small>
              </div>
              <div>
                <span>Historical comparisons</span>
                <strong>Not available</strong>
                <small>A prior-year value was not included.</small>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <BudgetTreemap entries={budgetEntries} />
        <section className="panel" aria-labelledby="change-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="change-title">
                Budget change vs previous year
              </h2>
              <p className="panel-subtitle">Neutral comparison · ₹ crore</p>
            </div>
          </div>
          <div className="empty-chart" role="status">
            <strong>Previous-year allocations are not available.</strong>
            The supplied snapshot has no financial-year label or prior-year
            amounts, so increases and decreases cannot be calculated.
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <BudgetOverTime />
        <section className="panel" aria-labelledby="method-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="method-title">How to read the figures</h2>
              <p className="panel-subtitle">Calculations used in this preview</p>
            </div>
          </div>
          <div className="section-pad">
            <p className="intro-copy">
              Department share is its listed allocation divided by the sum of
              all listed allocations. The median is the midpoint of the sorted
              department values.
            </p>
            <p className="intro-copy method-note">
              No trend, year-over-year change, or growth rate is inferred from
              this one-period, undated snapshot.
            </p>
          </div>
        </section>
      </div>

      <DepartmentTable entries={budgetEntries} />
    </main>
  );
}