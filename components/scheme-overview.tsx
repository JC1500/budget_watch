import Link from "next/link";
import { SchemeBudgetAnalysis } from "@/components/scheme-budget-analysis";
import { SchemeTable } from "@/components/scheme-table";
import {
  budgetRecords,
  getDepartmentHistory,
  getSchemeHistory,
  type BudgetEntry,
  type SchemeBudgetEntry,
} from "@/lib/budget-data";
import { buildYearTotals, summarizeSchemes } from "@/lib/analytics/budget";
import {
  calculateShare,
  calculateYoY,
  formatCroreCompact,
  formatCroreExact,
  formatPercent,
  formatShare,
} from "@/lib/format";

export function SchemeOverview({
  entries,
  previousEntries,
  departmentEntries,
  departments,
  years,
  selectedYear,
}: {
  entries: SchemeBudgetEntry[];
  previousEntries: SchemeBudgetEntry[];
  departmentEntries: BudgetEntry[];
  departments: { id: string; name: string }[];
  years: string[];
  selectedYear: string;
}) {
  const summary = summarizeSchemes(entries);
  const totalBudget = departmentEntries.reduce(
    (total, entry) =>
      Number.isFinite(entry.amountCrore) && entry.amountCrore >= 0
        ? total + entry.amountCrore
        : total,
    0,
  );
  const previousById = new Map(previousEntries.map((entry) => [entry.id, entry]));
  const featured = [...entries].sort((a, b) => b.amountCrore - a.amountCrore)[0];
  const featuredHistory = featured ? getSchemeHistory(featured.id) : [];
  const featuredDepartmentHistory = featured
    ? getDepartmentHistory(featured.departmentId)
    : [];
  const yearTotals = buildYearTotals(budgetRecords, years);
  const sortedAmounts = entries
    .map((entry) => entry.amountCrore)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const distribution = Array.from({ length: 5 }, (_, index) => {
    const min = sortedAmounts[0] ?? 0;
    const max = sortedAmounts.at(-1) ?? 0;
    const span = max - min;
    const lower = span === 0 ? min : min + span * index / 5;
    const upper = span === 0 ? max : min + span * (index + 1) / 5;
    const count =
      span === 0
        ? index === 0 ? sortedAmounts.length : 0
        : sortedAmounts.filter((amount) =>
            index === 4
              ? amount >= lower && amount <= upper
              : amount >= lower && amount < upper,
          ).length;
    return {
      label: span === 0
        ? formatCroreCompact(min)
        : `${formatCroreCompact(lower)}–${formatCroreCompact(upper)}`,
      count,
    };
  });
  const maxBucket = Math.max(...distribution.map((bucket) => bucket.count), 1);
  const featuredPrevious = featured ? previousById.get(featured.id) : undefined;

  return (
    <>
      <section className="summary-grid" aria-label={`Scheme summary for ${selectedYear}`}>
        <article className="summary-card">
          <span className="summary-label">Total schemes</span>
          <strong className="summary-value">{summary.count.toLocaleString("en-IN")}</strong>
          <span className="summary-sub">With source allocation data</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Largest scheme allocation</span>
          <strong className="summary-value">{summary.largest ? formatCroreCompact(summary.largest.amountCrore) : "—"}</strong>
          <span className="summary-sub">{summary.largest?.scheme ?? "No data"}</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Top scheme</span>
          <strong className="summary-value scheme-summary-name">{summary.largest?.scheme ?? "—"}</strong>
          <span className="summary-sub">{summary.largest?.department ?? "No data"}</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Median scheme allocation</span>
          <strong className="summary-value">{summary.median === null ? "—" : formatCroreCompact(summary.median)}</strong>
          <span className="summary-sub">Scheme records only · not department totals</span>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="scheme-ranking-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="scheme-ranking-title">Largest scheme budgets</h2>
              <p className="panel-subtitle">Top 10 by allocation · {selectedYear} · ₹ crore</p>
            </div>
          </div>
          <div className="ranking-list">
            {[...entries].sort((a, b) => b.amountCrore - a.amountCrore).slice(0, 10).map((entry) => (
              <div className="ranking-item" key={entry.id}>
                <Link
                  className="ranking-name"
                  href={`/schemes/${encodeURIComponent(entry.id)}?year=${encodeURIComponent(selectedYear)}`}
                  title={`${entry.scheme} · ${entry.department}`}
                >
                  {entry.scheme}
                </Link>
                <div className="ranking-track" role="img" aria-label={`${entry.scheme}: ${formatCroreExact(entry.amountCrore)}`}>
                  <div
                    className="ranking-bar"
                    style={{ width: `${summary.largest && summary.largest.amountCrore > 0 ? Math.max(0, entry.amountCrore / summary.largest.amountCrore * 100) : 0}%` }}
                  />
                </div>
                <span className="ranking-value">{formatCroreCompact(entry.amountCrore)}</span>
              </div>
            ))}
            {entries.length === 0 && <div className="empty-state">No scheme allocations are available.</div>}
          </div>
        </section>

        <section className="panel" aria-labelledby="scheme-distribution-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="scheme-distribution-title">Scheme allocation distribution</h2>
              <p className="panel-subtitle">Number of schemes across equal allocation ranges · {selectedYear}</p>
            </div>
          </div>
          <div className="scheme-distribution">
            {distribution.map((bucket, index) => (
              <div className="scheme-distribution-row" key={`${bucket.label}-${index}`}>
                <span>{bucket.label}</span>
                <div className="ranking-track" role="img" aria-label={`${bucket.count} schemes in ${bucket.label}`}>
                  <div className="ranking-bar" style={{ width: `${bucket.count / maxBucket * 100}%` }} />
                </div>
                <strong>{bucket.count}</strong>
              </div>
            ))}
          </div>
          <p className="ranking-caption">Allocation amounts are shown in ₹ crore. Negative values in the source are retained.</p>
        </section>
      </div>

      {featured && (
        <SchemeBudgetAnalysis
          history={featuredHistory}
          years={years}
          selectedYear={selectedYear}
          departmentHistory={featuredDepartmentHistory}
          yearTotals={yearTotals}
        />
      )}
      {featured && (
        <p className="ranking-caption scheme-featured-note">
          Historical trend: {featured.scheme} · {featured.department}
          {featuredPrevious
            ? ` · ${formatPercent(calculateYoY(featured.amountCrore, featuredPrevious.amountCrore))} YoY`
            : ""}
          {` · ${formatShare(calculateShare(featured.amountCrore, totalBudget))} of total budget`}
        </p>
      )}
      <SchemeTable
        entries={entries}
        previousEntries={previousEntries}
        departmentEntries={departmentEntries}
        departments={departments}
        years={years}
        selectedYear={selectedYear}
      />
    </>
  );
}
