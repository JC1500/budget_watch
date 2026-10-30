import { Suspense } from "react";
import { DepartmentTable } from "@/components/department-table";
import { budgetRecords, getBudgetsByYear, getDepartments, getFinancialYears } from "@/lib/budget-data";

type Props = { searchParams: Promise<{ year?: string }> };

async function ExplorerData({ searchParams }: Props) {
  const query = await searchParams;
  const years = getFinancialYears().map((entry) => entry.year);
  const year =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";
  const index = years.indexOf(year);

  return (
    <DepartmentTable
      entries={getDepartments(year)}
      previousEntries={index > 0 ? getBudgetsByYear(years[index - 1]) : []}
      allRecords={budgetRecords}
      years={years}
      explorer
    />
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
            Filter, sort, and export real budget rows from the local JSON
            datasets. CSV export includes only the rows matching your filters.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="panel skeleton table-skeleton" />}>
        <ExplorerData searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
