import { BudgetRanking } from "@/components/budget-ranking";
import { budgetEntries } from "@/lib/budget-data";
import { calculateVolatility } from "@/lib/format";

export default function TrendsPage() {
  const unavailableVolatility = calculateVolatility([]);

  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Allocation analysis</p>
          <h1>Trends</h1>
          <p className="intro-copy">
            Explore largest current allocations and see which analyses need
            additional historical data.
          </p>
        </div>
      </section>

      <div className="dashboard-grid">
        <BudgetRanking entries={budgetEntries} />
        <section className="panel" aria-labelledby="increase-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="increase-title">
                Largest budget increases and decreases
              </h2>
              <p className="panel-subtitle">Change from the previous financial year</p>
            </div>
          </div>
          <div className="empty-chart" role="status">
            <strong>Year-over-year changes cannot be calculated.</strong>
            The snapshot has no year labels or previous-year values.
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="growth-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="growth-title">
                Fastest growing departments
              </h2>
              <p className="panel-subtitle">Growth across available financial years</p>
            </div>
          </div>
          <div className="empty-chart" role="status">
            <strong>Historical data is not available.</strong>
            A single allocation per department cannot establish a growth rate.
          </div>
        </section>
        <section className="panel" aria-labelledby="stability-title">
          <div className="panel-header">
            <div>
              <h2 className="panel-title" id="stability-title">
                Year-to-year budget variation
              </h2>
              <p className="panel-subtitle">
                Standard deviation of successive annual percentage changes
              </p>
            </div>
          </div>
          <div className="empty-chart" role="status">
            <strong>
              {unavailableVolatility == null
                ? "Variation is not available."
                : `${unavailableVolatility.toFixed(1)}%`}
            </strong>
            At least two valid year-over-year changes are needed for a
            volatility estimate.
          </div>
        </section>
      </div>
    </main>
  );
}
