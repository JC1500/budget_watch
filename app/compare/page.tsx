import { Suspense } from "react";
import { DepartmentComparison } from "@/components/department-comparison";
import {
  budgetRecords,
  getDepartments,
  getFinancialYears,
} from "@/lib/budget-data";

type Props = { searchParams: Promise<{ year?: string }> };

async function CompareData({ searchParams }: Props) {
  const query = await searchParams;
  const years = getFinancialYears().map((entry) => entry.year);
  const year =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";

  return (
    <DepartmentComparison
      records={budgetRecords}
      years={years}
      selectedYear={year}
      departments={getDepartments(year)}
    />
  );
}

export default function ComparePage(props: Props) {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Side-by-side analysis</p>
          <h1>Compare departments</h1>
          <p className="intro-copy">
            Compare up to three departments across all available financial
            years. Budget differences are descriptive, not performance ratings.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="panel skeleton chart-skeleton" />}>
        <CompareData searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
