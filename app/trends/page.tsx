import { Suspense } from "react";
import Link from "next/link";
import { AnalysisLevelSelector } from "@/components/analysis-level-selector";
import {
  budgetRecords,
  getBudgetsByYear,
  getDepartmentHistory,
  getFinancialYears,
  getDepartments,
  getSchemeHistory,
  getSchemes,
} from "@/lib/budget-data";
import {
  getDepartmentCagr,
  getDepartmentRank,
  getDepartmentVolatility,
  getSchemeCagr,
  getSchemeVolatility,
  summarizeBudget,
  summarizeSchemes,
} from "@/lib/analytics/budget";
import { calculateAbsoluteChange, calculateShare, calculateYoY, formatCroreCompact, formatPercent, formatShare } from "@/lib/format";

type Props = { searchParams: Promise<{ year?: string; level?: string }> };
type TrendEntry = {
  id: string;
  department: string;
  displayValue: string;
  href?: string;
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
            <Link href={entry.href ?? `/departments/${entry.id}`}>{entry.department}</Link>
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

function SchemeTrendLists({
  year,
  previousYear,
  years,
}: {
  year: string;
  previousYear: string;
  years: string[];
}) {
  const current = getSchemes(year);
  const previousById = new Map(
    getSchemes(previousYear).map((entry) => [entry.id, entry]),
  );
  const changed = current.flatMap((entry) => {
    const previous = previousById.get(entry.id);
    if (!previous) return [];
    const absolute = calculateAbsoluteChange(entry.amountCrore, previous.amountCrore);
    const yoy = calculateYoY(entry.amountCrore, previous.amountCrore);
    return absolute === null || yoy === null
      ? []
      : [{ ...entry, absoluteChange: absolute, yoy }];
  });
  const increases = changed.filter((entry) => entry.absoluteChange > 0)
    .sort((a, b) => b.absoluteChange - a.absoluteChange);
  const decreases = changed.filter((entry) => entry.absoluteChange < 0)
    .sort((a, b) => a.absoluteChange - b.absoluteChange);
  const histories = [...new Map(current.map((entry) => [entry.id, entry])).values()]
    .map((entry) => ({ ...entry, history: getSchemeHistory(entry.id) }));
  const cagr = histories.map((entry) => ({
    ...entry,
    value: getSchemeCagr(entry.history, years),
  })).filter((entry) => entry.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const volatility = histories.map((entry) => ({
    ...entry,
    value: getSchemeVolatility(entry.history, years),
  })).filter((entry) => entry.value !== null)
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
  const departments = new Map(
    getDepartments(year).map((entry) => [entry.id, entry.amountCrore]),
  );
  const totalBudget = budgetRecords
    .filter((entry) => entry.financialYear === year && entry.amountCrore >= 0)
    .reduce((sum, entry) => sum + entry.amountCrore, 0);
  const byDepartmentShare = current.map((entry) => ({
    ...entry,
    share: calculateShare(
      entry.amountCrore,
      departments.get(entry.departmentId) ?? 0,
    ),
  })).filter((entry) => entry.share !== null)
    .sort((a, b) => (b.share ?? 0) - (a.share ?? 0));
  const byTotalShare = current.map((entry) => ({
    ...entry,
    share: calculateShare(entry.amountCrore, totalBudget),
  })).filter((entry) => entry.share !== null)
    .sort((a, b) => (b.share ?? 0) - (a.share ?? 0));
  const summary = summarizeSchemes(current);
  const schemeHref = (id: string) => `/schemes/${encodeURIComponent(id)}?year=${encodeURIComponent(year)}`;

  return (
    <>
      <div className="summary-grid" aria-label={`Scheme trend summary for ${year}`}>
        <article className="summary-card"><span className="summary-label">Total schemes</span><strong className="summary-value">{summary.count}</strong><span className="summary-sub">{year}</span></article>
        <article className="summary-card"><span className="summary-label">Largest scheme</span><strong className="summary-value">{summary.largest ? formatCroreCompact(summary.largest.amountCrore) : "—"}</strong><span className="summary-sub">{summary.largest?.scheme ?? "No data"}</span></article>
        <article className="summary-card"><span className="summary-label">Largest increase</span><strong className="summary-value">{increases[0] ? formatCroreCompact(increases[0].absoluteChange) : "—"}</strong><span className="summary-sub">{increases[0]?.scheme ?? "No comparable data"}</span></article>
        <article className="summary-card"><span className="summary-label">Scheme allocations</span><strong className="summary-value">{formatCroreCompact(summary.total)}</strong><span className="summary-sub">Scheme records only · {year}</span></article>
      </div>
      <div className="dashboard-grid">
        <TrendList title="Largest scheme allocation increases" subtitle={`${year} vs ${previousYear || "no previous year"}`} entries={increases.map((entry) => ({ ...entry, department: entry.scheme, displayValue: formatCroreCompact(entry.absoluteChange), href: schemeHref(entry.id) }))} />
        <TrendList title="Largest scheme allocation decreases" subtitle={`${year} vs ${previousYear || "no previous year"}`} entries={decreases.map((entry) => ({ ...entry, department: entry.scheme, displayValue: formatCroreCompact(entry.absoluteChange), href: schemeHref(entry.id) }))} />
      </div>
      <div className="dashboard-grid">
        <TrendList title="Highest scheme CAGR" subtitle="Compound annual growth across observed years" entries={cagr.map((entry) => ({ ...entry, department: entry.scheme, displayValue: formatPercent(entry.value), href: schemeHref(entry.id) }))} />
        <TrendList title="Largest share of department budget" subtitle={`${year} · scheme allocation divided by its department total`} entries={byDepartmentShare.map((entry) => ({ ...entry, department: entry.scheme, displayValue: formatShare(entry.share), href: schemeHref(entry.id) }))} />
      </div>
      <div className="dashboard-grid">
        <TrendList title="Largest share of total budget" subtitle={`${year} · scheme allocation divided by government-wide department totals`} entries={byTotalShare.map((entry) => ({ ...entry, department: entry.scheme, displayValue: formatShare(entry.share), href: schemeHref(entry.id) }))} />
        <TrendList title="Most stable schemes" subtitle="Lowest standard deviation of observed annual percentage changes" entries={volatility.map((entry) => ({ ...entry, department: entry.scheme, displayValue: formatPercent(entry.value), href: schemeHref(entry.id) }))} />
      </div>
      <TrendList title="Most variable schemes" subtitle="Highest standard deviation of observed annual percentage changes" entries={[...volatility].reverse().map((entry) => ({ ...entry, department: entry.scheme, displayValue: formatPercent(entry.value), href: schemeHref(entry.id) }))} />
      <p className="ranking-caption trend-disclaimer">Scheme-level totals and shares are calculated from scheme rows only; parent department totals remain separate.</p>
    </>
  );
}

async function TrendsData({ searchParams }: Props) {
  const query = await searchParams;
  const years = getFinancialYears().map((entry) => entry.year);
  const analysisLevel = query.level === "schemes" ? "schemes" : "departments";
  const year = query.year && years.includes(query.year) ? query.year : years.at(-1) ?? "";
  const index = years.indexOf(year);
  const previousYear = index > 0 ? years[index - 1] : "";
  if (analysisLevel === "schemes") {
    return (
      <>
        <div className="analysis-toolbar"><AnalysisLevelSelector value={analysisLevel} /></div>
        <SchemeTrendLists year={year} previousYear={previousYear} years={years} />
      </>
    );
  }
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
      <div className="analysis-toolbar"><AnalysisLevelSelector value={analysisLevel} /></div>
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
