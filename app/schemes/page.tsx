import { Suspense } from "react";
import { SchemeTable } from "@/components/scheme-table";
import {
  budgetRecords,
  getDepartments,
  getFinancialYears,
  getSchemes,
} from "@/lib/budget-data";

type Props = { searchParams: Promise<{ year?: string }> };

async function SchemeDirectory({ searchParams }: Props) {
  const query = await searchParams;
  const years = getFinancialYears().map((entry) => entry.year);
  const selectedYear =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";
  const yearIndex = years.indexOf(selectedYear);
  const previousYear = yearIndex > 0 ? years[yearIndex - 1] : "";
  const departments = [
    ...new Map(
      budgetRecords.map((record) => [
        record.id,
        { id: record.id, name: record.department },
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SchemeTable
      entries={getSchemes(selectedYear)}
      previousEntries={previousYear ? getSchemes(previousYear) : []}
      departmentEntries={getDepartments(selectedYear)}
      departments={departments}
      years={years}
      selectedYear={selectedYear}
    />
  );
}

export default function SchemesPage(props: Props) {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Budget directory</p>
          <h1>Schemes</h1>
          <p className="intro-copy">
            Search scheme allocations by department and financial year. Scheme
            totals are kept separate from department-level totals.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="panel skeleton table-skeleton" />}>
        <SchemeDirectory searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
