import { Suspense } from "react";
import { DepartmentTable } from "@/components/department-table";
import { SchemeTable } from "@/components/scheme-table";
import { AnalysisLevelSelector } from "@/components/analysis-level-selector";
import {
  budgetRecords,
  getBudgetsByYear,
  getDepartments,
  getFinancialYears,
  getSchemeCountsByDepartment,
  getSchemes,
} from "@/lib/budget-data";

type Props = { searchParams: Promise<{ year?: string; entity?: string }> };

async function ExplorerData({ searchParams }: Props) {
  const query = await searchParams;
  const analysisLevel = query.entity === "schemes" ? "schemes" : "departments";
  const years = getFinancialYears().map((entry) => entry.year);
  const year =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";
  const index = years.indexOf(year);

  const departments = [
    ...new Map(
      budgetRecords.map((record) => [
        record.id,
        { id: record.id, name: record.department },
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <div className="analysis-toolbar">
        <AnalysisLevelSelector value={analysisLevel} parameter="entity" label="Entity type" />
      </div>
      {analysisLevel === "schemes" ? (
        <SchemeTable
          entries={getSchemes(year)}
          previousEntries={index > 0 ? getSchemes(years[index - 1]) : []}
          departmentEntries={getDepartments(year)}
          departments={departments}
          years={years}
          selectedYear={year}
          explorer
        />
      ) : (
        <DepartmentTable
          entries={getDepartments(year)}
          previousEntries={index > 0 ? getBudgetsByYear(years[index - 1]) : []}
          allRecords={budgetRecords}
          years={years}
          explorer
          schemeCounts={getSchemeCountsByDepartment(year)}
        />
      )}
    </>
  );
}

export default function ExplorerPage(props: Props) {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Advanced data access</p>
          <h1>Data explorer</h1>
          <p className="intro-copy">
            Filter, sort, and export source department or scheme rows. CSV
            export includes only the rows matching your filters.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="panel skeleton table-skeleton" />}>
        <ExplorerData searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
