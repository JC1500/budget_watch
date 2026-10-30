import { DepartmentComparison } from "@/components/department-comparison";

export default function ComparePage() {
  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Side-by-side analysis</p>
          <h1>Compare departments</h1>
          <p className="intro-copy">
            Compare the allocations in the supplied snapshot. Differences are
            descriptive and do not imply performance or priority.
          </p>
        </div>
      </section>
      <DepartmentComparison />
    </main>
  );
}
