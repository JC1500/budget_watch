import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SchemeBudgetAnalysis } from "@/components/scheme-budget-analysis";
import { SchemeDetailHeader } from "@/components/scheme-detail-header";
import {
  budgetRecords,
  getDepartmentHistory,
  getFinancialYears,
  getScheme,
  getSchemeHistory,
  getSchemes,
  schemeRecords,
} from "@/lib/budget-data";
import {
  buildYearTotals,
  getDepartmentSchemeRank,
  getSchemeCagr,
  getSchemeRank,
  getSchemeVolatility,
} from "@/lib/analytics/budget";
import {
  calculateAbsoluteChange,
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
  return [...new Set(schemeRecords.map((record) => record.id))].map((id) => ({ id }));
}

async function SchemeDetailContent({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const years = getFinancialYears().map((entry) => entry.year);
  const year =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";
  const history = getSchemeHistory(id);
  if (history.length === 0) notFound();

  const scheme = getScheme(id, year);
  const representative = scheme ?? history.at(-1)!;
  const departmentHistory = getDepartmentHistory(representative.departmentId);
  const currentDepartment = departmentHistory.find(
    (entry) => entry.financialYear === year,
  );
  const yearIndex = years.indexOf(year);
  const previousYear = yearIndex > 0 ? years[yearIndex - 1] : "";
  const previousScheme = previousYear ? getScheme(id, previousYear) : undefined;
  const currentSchemes = getSchemes(year);
  const rank = scheme ? getSchemeRank(scheme, currentSchemes) : null;
  const departmentRank = scheme
    ? getDepartmentSchemeRank(scheme, currentSchemes)
    : null;
  const shareOfDepartment =
    scheme && currentDepartment
      ? calculateShare(scheme.amountCrore, currentDepartment.amountCrore)
      : null;
  const yearTotals = buildYearTotals(budgetRecords, years);
  const totalBudget =
    yearTotals.find((entry) => entry.financialYear === year)?.total ?? 0;
  const shareOfTotal = scheme
    ? calculateShare(scheme.amountCrore, totalBudget)
    : null;
  const yoy =
    scheme && previousScheme
      ? calculateYoY(scheme.amountCrore, previousScheme.amountCrore)
      : null;
  const schemeOptions = [
    ...new Map(
      schemeRecords.map((entry) => [
        entry.id,
        {
          id: entry.id,
          name: entry.scheme,
          department: entry.department,
          departmentId: entry.departmentId,
        },
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const yearSchemeRanks = new Map(
    years.map((financialYear) => {
      const entry = getScheme(id, financialYear);
      const entries = getSchemes(financialYear);
      return [
        financialYear,
        entry
          ? {
              overall: getSchemeRank(entry, entries),
              department: getDepartmentSchemeRank(entry, entries),
            }
          : null,
      ] as const;
    }),
  );

  return (
    <main className="page-shell">
      <SchemeDetailHeader
        schemes={schemeOptions}
        selectedSchemeId={id}
        selectedYear={year}
        years={years}
      />
      <div className="scheme-parent-context">
        <span>Department</span>
        <Link href={`/departments/${representative.departmentId}?year=${encodeURIComponent(year)}`}>
          {representative.department}
        </Link>
      </div>

      <section className="detail-summary-strip scheme-summary-strip" aria-label="Scheme summary">
        <div className="detail-metric">
          <span className="detail-metric-label">Allocation</span>
          <strong className="detail-metric-value">{scheme ? formatCroreExact(scheme.amountCrore) : "—"}</strong>
          <small className="detail-metric-note">{scheme ? year : `No allocation in ${year}`}</small>
        </div>
        <div className="detail-metric">
          <span className="detail-metric-label">Share of department</span>
          <strong className="detail-metric-value">{formatShare(shareOfDepartment)}</strong>
          <small className="detail-metric-note">Selected year</small>
        </div>
        <div className="detail-metric">
          <span className="detail-metric-label">Share of total budget</span>
          <strong className="detail-metric-value">{formatShare(shareOfTotal)}</strong>
          <small className="detail-metric-note">Department-level government total</small>
        </div>
        <div className="detail-metric">
          <span className="detail-metric-label">YoY change</span>
          <strong className="detail-metric-value">{formatPercent(yoy)}</strong>
          <small className="detail-metric-note">vs {previousYear || "prior year"}</small>
        </div>
        <div className="detail-metric">
          <span className="detail-metric-label">Overall scheme rank</span>
          <strong className="detail-metric-value">{rank === null ? "—" : `#${rank}`}</strong>
          <small className="detail-metric-note">
            Department rank {departmentRank === null ? "—" : `#${departmentRank}`}
          </small>
        </div>
      </section>

      <div className="scheme-detail-flow">
        <SchemeBudgetAnalysis
          history={history}
          years={years}
          selectedYear={year}
          departmentHistory={departmentHistory}
          yearTotals={yearTotals}
        />
        <section className="panel" aria-labelledby="scheme-history-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="scheme-history-title">Year-by-year scheme data</h2>
              <p className="panel-subtitle">Missing source years are shown as unavailable, not zero.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table scheme-data-table">
              <thead>
                <tr>
                  <th scope="col">Financial year</th>
                  <th className="numeric" scope="col">Allocation</th>
                  <th className="numeric" scope="col">Share of department</th>
                  <th className="numeric" scope="col">Share of total budget</th>
                  <th className="numeric" scope="col">Previous year</th>
                  <th className="numeric" scope="col">Absolute change</th>
                  <th className="numeric" scope="col">YoY %</th>
                  <th className="numeric" scope="col">Overall rank</th>
                  <th className="numeric" scope="col">Department rank</th>
                </tr>
              </thead>
              <tbody>
                {years.map((financialYear, index) => {
                  const entry = history.find((candidate) => candidate.financialYear === financialYear);
                  const oldYear = index > 0 ? years[index - 1] : undefined;
                  const old = oldYear
                    ? history.find((candidate) => candidate.financialYear === oldYear)
                    : undefined;
                  const departmentAllocation = departmentHistory.find(
                    (candidate) => candidate.financialYear === financialYear,
                  )?.amountCrore;
                  const total = yearTotals.find(
                    (candidate) => candidate.financialYear === financialYear,
                  )?.total;
                  const ranks = yearSchemeRanks.get(financialYear);
                  const absoluteChange = entry
                    ? calculateAbsoluteChange(entry.amountCrore, old?.amountCrore)
                    : null;
                  return (
                    <tr key={financialYear}>
                      <td>{financialYear}</td>
                      <td className="numeric">{entry ? formatCroreExact(entry.amountCrore) : "—"}</td>
                      <td className="numeric">{entry && departmentAllocation !== undefined ? formatShare(calculateShare(entry.amountCrore, departmentAllocation)) : "—"}</td>
                      <td className="numeric">{entry && total !== undefined ? formatShare(calculateShare(entry.amountCrore, total)) : "—"}</td>
                      <td className="numeric">{old ? formatCroreExact(old.amountCrore) : "—"}</td>
                      <td className="numeric">{absoluteChange === null ? "—" : formatCroreExact(absoluteChange)}</td>
                      <td className="numeric">{entry && old ? formatPercent(calculateYoY(entry.amountCrore, old.amountCrore)) : "—"}</td>
                      <td className="numeric">{ranks ? `#${ranks.overall}` : "—"}</td>
                      <td className="numeric">{ranks ? `#${ranks.department}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <p className="ranking-caption scheme-history-note">
        CAGR {formatPercent(getSchemeCagr(history, years))} · Annual variation {formatPercent(getSchemeVolatility(history, years))}. Growth calculations use observed values only and do not treat gaps as zero.
      </p>
    </main>
  );
}

export default function SchemeDetailPage(props: Props) {
  return (
    <Suspense fallback={<main className="page-shell"><div className="panel skeleton table-skeleton" /></main>}>
      <SchemeDetailContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
