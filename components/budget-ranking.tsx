"use client";

import Link from "next/link";
import { useState } from "react";
import type { BudgetEntry } from "@/lib/budget-data";
import { formatCroreExact } from "@/lib/format";

const topOptions = [10, 20, Number.POSITIVE_INFINITY] as const;

export function BudgetRanking({ entries }: { entries: BudgetEntry[] }) {
  const [topN, setTopN] = useState<number>(10);
  const sortedEntries = [...entries].sort(
    (a, b) => b.amountCrore - a.amountCrore,
  );
  const visibleEntries = sortedEntries.slice(0, topN);
  const maxAmount = visibleEntries[0]?.amountCrore ?? 0;

  return (
    <section className="panel" aria-labelledby="ranking-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="ranking-title">Budget by department</h2>
          <p className="panel-subtitle">Ranked by allocation · ₹ crore</p>
        </div>
        <div className="chart-controls" role="group" aria-label="Departments shown">
          {topOptions.map((option) => (
            <button
              aria-pressed={topN === option}
              key={option}
              onClick={() => setTopN(option)}
              type="button"
            >
              {Number.isFinite(option) ? `Top ${option}` : "All"}
            </button>
          ))}
        </div>
      </div>
      {visibleEntries.length > 0 ? (
        <>
          <div className="ranking-list" role="list" aria-label="Department budget ranking">
            {visibleEntries.map((entry) => (
              <div className="ranking-item" key={entry.id} role="listitem">
                <Link
                  className="ranking-name"
                  href={`/departments/${entry.id}`}
                  title={entry.department}
                >
                  {entry.department}
                </Link>
                <div
                  className="ranking-track"
                  role="img"
                  aria-label={`${entry.department}: ${formatCroreExact(entry.amountCrore)}`}
                >
                  <div
                    className="ranking-bar"
                    style={{
                      width: `${maxAmount > 0 ? (entry.amountCrore / maxAmount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="ranking-value">
                  {entry.amountCrore.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
          </div>
          <p className="ranking-caption">
            Each bar is scaled against the largest allocation shown.
          </p>
        </>
      ) : (
        <div className="empty-state">No budget data is available.</div>
      )}
    </section>
  );
}
