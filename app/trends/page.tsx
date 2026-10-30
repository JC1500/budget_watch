import { Suspense } from "react";
import Link from "next/link";
import {
  getBudgetsByYear,
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
import { calculateAbsoluteChange, calculateYoY, formatCroreCompact, formatPercent, formatShare } from "@/lib/format";

type Props = { searchParams: Promise<{ year?: string }> };
type TrendEntry = {
  id: string;
  department: string;
  displayValue: string;
};

function TrendList({
  title,
  subtitle,
  entries,
}: {
  title: string;
  subtitle: string;
  entries: TrendEntry[];
}) {
  return (
    <section className="panel" aria-label={title}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-subtitle">{subtitle}</p>
        </div>
      </div>
      <ol className="insight-list">
        {entries.slice(0, 10).map((entry) => (
          <li key={entry.id}>
            <Link href={`/departments/${entry.id}`}>{entry.department}</Link>
            <strong>{entry.displayValue}</strong>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="insight-empty">No comparable records are available.</li>
        )}
      </ol>
    </section>
  );
}

async function TrendsData({ searchParams }: Props) {
  const query = await searchParams;
  const years = getFinancialYears().map((entry) => entry.year);
  const year = query.year && years.includes(query.year) ? query.year : years.at(-1) ?? "";
  const index = years.indexOf(year);
  const previousYear = index > 0 ? years[index - 1] : "";
  const current = getDepartments(year);
  const previousById = new Map(getBudgetsByYear(previousYear).map((entry) => [entry.id, entry]));
  const changed = current.flatMap((entry) => {
    const previous = previousById.get(entry.id);
    if (!previous) return [];
    const absolute = calculateAbsoluteChange(entry.amountCrore, previous.amountCrore);
    const yoy = calculateYoY(entry.amountCrore, previous.amountCrore);
    return absolute === null || yoy === null
      ? []
      : [{ ...entry, absoluteChange: absolute, yoy }];
  });
  const increases = changed.filter((entry) => entry.absoluteChange > 0).sort((a, b) => b.absoluteChange - a.absoluteChange);
  const decreases = changed.filter((entry) => entry.absoluteChange < 0).sort((a, b) => a.absoluteChange - b.absoluteChange);
  const cagrList = [...new Map(current.map((entry) => [entry.id, entry])).values()]
    .map((entry) => ({
      ...entry,
      cagr: getDepartmentCagr(getDepartmentHistory(entry.id), years),
    }))
    .filter((entry) => entry.cagr !== null)
    .sort((a, b) => (b.cagr ?? 0) - (a.cagr ?? 0));
  const volatilityList = [...new Map(current.map((entry) => [entry.id, entry])).values()]
    .map((entry) => ({
      ...entry,
      volatility: getDepartmentVolatility(getDepartmentHistory(entry.id), years),
    }))
    .filter((entry) => entry.volatility !== null)
    .sort((a, b) => (a.volatility ?? 0) - (b.volatility ?? 0));
  const initialRanks = new Map(
    getDepartments(years[0]).map((entry) => [entry.id, getDepartmentRank(entry, getDepartments(years[0]))]),
  );
  const rankChanges = current.flatMap((entry) => {
    const initialRank = initialRanks.get(entry.id);
    if (!initialRank) return [];
    const latestRank = getDepartmentRank(entry, current);
    return [{ ...entry, rankChange: initialRank - latestRank, initialRank, latestRank }];
  });
  const rankGainers = rankChanges.filter((entry) => entry.rankChange > 0).sort((a, b) => b.rankChange - a.rankChange);
  const rankFallers = rankChanges.filter((entry) => entry.rankChange < 0).sort((a, b) => a.rankChange - b.rankChange);
  const summary = summarizeBudget(current);

  return (
    <>
      <div className="summary-grid" aria-label={`Trend summary for ${year}`}>
        <article className="summary-card">
          <span className="summary-label">Largest allocation</span>
          <strong className="summary-value">{summary.largest ? formatCroreCompact(summary.largest.amountCrore) : "—"}</strong>
          <span className="summary-sub">{summary.largest?.department ?? "No data"}</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Largest increase · {previousYear || "prior year"}</span>
          <strong className="summary-value">{increases[0] ? formatCroreCompact(increases[0].absoluteChange) : "—"}</strong>
          <span className="summary-sub">{increases[0]?.department ?? "No comparable data"}</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Top 10 budget share</span>
          <strong className="summary-value">{formatShare(summary.topTenShare)}</strong>
          <span className="summary-sub">Of listed department allocations</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Department rows</span>
          <strong className="summary-value">{current.length}</strong>
          <span className="summary-sub">{year}</span>
        </article>
      </div>

      <div className="dashboard-grid">
        <TrendList title="Largest absolute increases" subtitle={`${year} vs ${previousYear || "no previous year"}`} entries={increases.map((entry) => ({ ...entry, displayValue: formatCroreCompact(entry.absoluteChange) }))} />
        <TrendList
          title="Largest absolute decreases"
          subtitle={`${year} vs ${previousYear || "no previous year"}`}
          entries={decreases.map((entry) => ({ ...entry, displayValue: formatCroreCompact(entry.absoluteChange) }))}
        />
      </div>
      <div className="dashboard-grid">
        <TrendList
          title="Fastest percentage growth · available history"
          subtitle="Compound annual growth rate"
          entries={cagrList.map((entry) => ({ ...entry, displayValue: formatPercent(entry.cagr) }))}
        />
        <TrendList
          title="Largest percentage declines"
          subtitle={`${year} vs ${previousYear || "no previous year"}`}
          entries={[...decreases].sort((a, b) => a.yoy - b.yoy).map((entry) => ({ ...entry, displayValue: formatPercent(entry.yoy) }))}
        />
      </div>
      <div className="dashboard-grid">
        <TrendList
          title="Most stable budget changes"
          subtitle="Lowest standard deviation of annual percentage changes"
          entries={volatilityList.map((entry) => ({ ...entry, displayValue: formatPercent(entry.volatility) }))}
        />
        <TrendList
          title="Most variable budget changes"
          subtitle="Highest standard deviation of annual percentage changes"
          entries={[...volatilityList].reverse().map((entry) => ({ ...entry, displayValue: formatPercent(entry.volatility) }))}
        />
      </div>
      <div className="dashboard-grid">
        <TrendList
          title="Largest rank gains"
          subtitle={`Rank movement from ${years[0]} to ${year}`}
          entries={rankGainers.map((entry) => ({ ...entry, displayValue: `${entry.initialRank} → ${entry.latestRank} (+${entry.rankChange})` }))}
        />
        <TrendList
          title="Largest rank drops"
          subtitle={`Rank movement from ${years[0]} to ${year}`}
          entries={rankFallers.map((entry) => ({ ...entry, displayValue: `${entry.initialRank} → ${entry.latestRank} (${entry.rankChange})` }))}
        />
      </div>
      <p className="ranking-caption trend-disclaimer">
        Budget variation describes changes in allocations; it does not imply
        performance, effectiveness, or outcomes.
      </p>
    </>
  );
}

export default function TrendsPage(props: Props) {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Allocation analysis</p>
          <h1>Trends</h1>
          <p className="intro-copy">
            Compare budget amounts, shares, growth rates, and rank changes over
            the financial years in the source files.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="panel skeleton table-skeleton" />}>
        <TrendsData searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
