import Link from "next/link";
import { notFound } from "next/navigation";
import {
  budgetEntries,
  getDepartment,
  totalBudgetCrore,
} from "@/lib/budget-data";
import {
  calculateRank,
  calculateShare,
  formatCroreExact,
  formatShare,
} from "@/lib/format";

export function generateStaticParams() {
  return budgetEntries.map(({ id }) => ({ id }));
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const department = getDepartment(id);

  if (!department) notFound();

  const rank = calculateRank(
    department.amountCrore,
    budgetEntries.map((entry) => entry.amountCrore),
  );
  const share = calculateShare(department.amountCrore, totalBudgetCrore);

  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">
            <Link className="text-link" href="/departments">Departments</Link>
            {" / "}Department detail
          </p>
          <h1>{department.department}</h1>
          <p className="intro-copy">{department.ministry}</p>
        </div>
      </section>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel" aria-labelledby="history-title">
            <div className="panel-header">
              <div>
                <h2 className="panel-title" id="history-title">Historical budget trend</h2>
                <p className="panel-subtitle">Budget values by financial year · ₹ crore</p>
              </div>
            </div>
            <div className="empty-chart" role="status">
              <strong>No historical data is available.</strong>
              The supplied preview contains one amount without a financial-year
              label, so a trend cannot be drawn.
            </div>
          </section>

          <section className="panel" aria-labelledby="history-table-title">
            <div className="panel-header">
              <div>
                <h2 className="panel-title" id="history-table-title">Year-by-year budget</h2>
                <p className="panel-subtitle">Only the supplied snapshot is shown</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Financial year</th>
                    <th className="numeric" scope="col">Budget</th>
                    <th className="numeric" scope="col">YoY change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Not supplied</td>
                    <td className="numeric">{formatCroreExact(department.amountCrore)}</td>
                    <td className="numeric">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="detail-aside" aria-label="Department summary">
          <article className="panel detail-stat">
            <span className="summary-label">Listed allocation</span>
            <strong className="summary-value">
              {formatCroreExact(department.amountCrore)}
            </strong>
            <span className="summary-sub">Financial year not supplied</span>
          </article>
          <article className="panel detail-stat">
            <span className="summary-label">Rank · listed departments</span>
            <strong className="summary-value">#{rank}</strong>
            <span className="summary-sub">
              {formatShare(share)} of listed total
            </span>
          </article>
          <article className="panel detail-stat">
            <span className="summary-label">Ministry</span>
            <strong className="detail-ministry">{department.ministry}</strong>
          </article>
          <div className="dataset-note">
            <span className="status-dot" aria-hidden="true" />
            <span>This is user-provided preview data, not a verified official source.</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
