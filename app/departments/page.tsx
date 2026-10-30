import { DepartmentTable } from "@/components/department-table";
import { budgetEntries } from "@/lib/budget-data";

export default function DepartmentsPage() {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Directory</p>
          <h1>Departments</h1>
          <p className="intro-copy">
            Search and compare the allocations in the supplied preview snapshot.
            No previous-year figures were provided.
          </p>
        </div>
      </section>
      <DepartmentTable entries={budgetEntries} />
    </main>
  );
}
