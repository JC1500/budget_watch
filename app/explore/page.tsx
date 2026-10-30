import { DepartmentTable } from "@/components/department-table";
import { budgetEntries } from "@/lib/budget-data";

export default function ExplorePage() {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Advanced data access</p>
          <h1>Data explorer</h1>
          <p className="intro-copy">
            Filter, sort, and export the supplied department allocations. CSV
            export includes only the rows matching your current filters.
          </p>
        </div>
        <aside className="dataset-note" aria-label="Dataset limitations">
          <span className="status-dot" aria-hidden="true" />
          <span>
            <strong>Undated snapshot.</strong> Year, prior-year, and growth
            filters are unavailable.
          </span>
        </aside>
      </section>
      <DepartmentTable entries={budgetEntries} explorer />
    </main>
  );
}
