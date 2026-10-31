import Link from "next/link";
import { formatCroreCompact, formatShare } from "@/lib/format";

export type DepartmentSchemeRow = {
  id: string;
  name: string;
  allocation: number | null;
  shareOfDepartment: number | null;
};

export function DepartmentSchemeList({
  departmentId,
  ministry,
  rows,
  selectedSchemeId,
  selectedYear,
}: {
  departmentId: string;
  ministry: string;
  rows: DepartmentSchemeRow[];
  selectedSchemeId: string;
  selectedYear: string;
}) {
  const departmentUrl = `/departments/${departmentId}?year=${encodeURIComponent(selectedYear)}`;

  return (
    <section className="department-schemes" aria-labelledby="department-schemes-title">
      <header className="department-schemes-header">
        <div>
          <h2 id="department-schemes-title">Schemes in this department</h2>
          <p>
            {rows.length} {rows.length === 1 ? "scheme" : "schemes"} · {ministry}
          </p>
        </div>
        <span className="department-schemes-year">{selectedYear}</span>
      </header>
      {rows.length > 0 ? (
        <>
          <div className="department-scheme-columns" aria-hidden="true">
            <span>Scheme</span>
            <span>Allocation</span>
            <span>Share of department</span>
            <span>Action</span>
          </div>
          <ol className="department-scheme-list">
            {rows.map((row) => {
              const isSelected = row.id === selectedSchemeId;
              const href = isSelected
                ? departmentUrl
                : `${departmentUrl}&scheme=${encodeURIComponent(row.id)}`;
              return (
                <li className="department-scheme-list-item" key={row.id}>
                  <Link
                    aria-current={isSelected ? "true" : undefined}
                    className={`department-scheme-row${isSelected ? " is-selected" : ""}`}
                    href={href}
                    scroll={false}
                  >
                    <span className="department-scheme-name" data-label="Scheme">
                      {row.name}
                    </span>
                    <span className="department-scheme-allocation" data-label="Allocation">
                      {row.allocation === null
                        ? `No allocation data for ${selectedYear}`
                        : (
                          <>
                            <strong>{formatCroreCompact(row.allocation)}</strong>
                            <small>{selectedYear}</small>
                          </>
                        )}
                    </span>
                    <span className="department-scheme-share" data-label="Share of department">
                      {formatShare(row.shareOfDepartment)}
                    </span>
                    <span className="department-scheme-action">
                      {isSelected ? "Hide analysis" : "View analysis"}
                      <span aria-hidden="true"> →</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <p className="department-schemes-empty">
          No scheme-level budget data is available for this department.
        </p>
      )}
    </section>
  );
}
