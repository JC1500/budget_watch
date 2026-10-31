import { Suspense } from "react";
import { DepartmentComparison } from "@/components/department-comparison";
import { SchemeComparison } from "@/components/scheme-comparison";
import { AnalysisLevelSelector } from "@/components/analysis-level-selector";
import {
  budgetRecords,
  getDepartments,
  getFinancialYears,
  getSchemes,
  schemeRecords,
} from "@/lib/budget-data";

type Props = { searchParams: Promise<{ year?: string; type?: string }> };

async function CompareData({ searchParams }: Props) {
  const query = await searchParams;
  const years = getFinancialYears().map((entry) => entry.year);
  const analysisType = query.type === "schemes" ? "schemes" : "departments";
  const year =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";

  return (
    <>
      <div className="analysis-toolbar">
        <AnalysisLevelSelector value={analysisType} parameter="type" label="Compare type" />
      </div>
      {analysisType === "schemes" ? (
        <SchemeComparison
          schemes={getSchemes(year)}
          records={schemeRecords}
          departmentRecords={budgetRecords}
          years={years}
          selectedYear={year}
        />
      ) : (
        <DepartmentComparison
          records={budgetRecords}
          years={years}
          selectedYear={year}
          departments={getDepartments(year)}
        />
      )}
    </>
  );
}

export default function ComparePage(props: Props) {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Side-by-side analysis</p>
          <h1>Compare budgets</h1>
          <p className="intro-copy">
            Compare departments or schemes across financial years. Budget
            differences are descriptive, not performance ratings.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="panel skeleton chart-skeleton" />}>
        <CompareData searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
