import { Suspense } from "react";
import { DepartmentTable } from "@/components/department-table";
import { budgetRecords, getBudgetsByYear, getDepartments, getFinancialYears } from "@/lib/budget-data";

type Props = { searchParams: Promise<{ year?: string }> };

async function DepartmentList({ searchParams }: Props) {
  const query = await searchParams;
  const years = getFinancialYears().map((entry) => entry.year);
  const year =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";
  const index = years.indexOf(year);
  const previousYear = index > 0 ? years[index - 1] : "";
  const entries = getDepartments(year);

  return (
    <DepartmentTable
      entries={entries}
      previousEntries={getBudgetsByYear(previousYear)}
      allRecords={budgetRecords}
      years={years}
    />
  );
}

export default function DepartmentsPage(props: Props) {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Directory</p>
          <h1>Departments</h1>
          <p className="intro-copy">
            Search, sort, and compare department allocations across the
            available financial years.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="panel skeleton table-skeleton" />}>
        <DepartmentList searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
