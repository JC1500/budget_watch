"use client";

import { useMemo, useState } from "react";
import { budgetEntries, totalBudgetCrore } from "@/lib/budget-data";
import {
  calculateAbsoluteChange,
  calculateShare,
  calculateYoY,
  formatCroreExact,
  formatPercent,
  formatShare,
} from "@/lib/format";

export function DepartmentComparison() {
  const [selectedIds, setSelectedIds] = useState(
    budgetEntries.slice(0, 2).map((entry) => entry.id),
  );
  const selectedEntries = useMemo(
    () =>
      selectedIds.flatMap((id) => {
        const entry = budgetEntries.find((candidate) => candidate.id === id);
        return entry ? [entry] : [];
      }),
    [selectedIds],
  );
  const baseDepartment = selectedEntries[0];
  const maxAmount = Math.max(
    0,
    ...selectedEntries.map((entry) => entry.amountCrore),
  );

  function updateSelection(index: number, nextId: string) {
    setSelectedIds((ids) =>
      ids.map((id, currentIndex) =>
        currentIndex === index ? nextId : id,
      ),
    );
  }

  function addDepartment() {
    const next = budgetEntries.find(
      (entry) => !selectedIds.includes(entry.id),
    );
    if (next && selectedIds.length < 3) {
      setSelectedIds((ids) => [...ids, next.id]);
    }
  }

  function removeThirdDepartment() {
    setSelectedIds((ids) => ids.slice(0, 2));
  }

  return (
    <>
      <section className="panel" aria-label="Choose departments to compare">
        <div className="compare-controls compare-controls-multi">
          {selectedIds.map((id, index) => (
            <label className="field-label" htmlFor={`compare-${index}`} key={index}>
              Department {String.fromCharCode(65 + index)}
              <select
                className="select-field"
                id={`compare-${index}`}
                onChange={(event) => updateSelection(index, event.target.value)}
                value={id}
              >
                {budgetEntries.map((entry) => (
                  <option
                    disabled={selectedIds.includes(entry.id) && entry.id !== id}
                    key={entry.id}
                    value={entry.id}
                  >
                    {entry.department}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {selectedIds.length < 3 ? (
            <button
              className="secondary-button compare-add"
              onClick={addDepartment}
              type="button"
            >
              + Add department
            </button>
          ) : (
            <button
              className="secondary-button compare-add"
              onClick={removeThirdDepartment}
              type="button"
            >
              Remove Department C
            </button>
          )}
        </div>

        {selectedEntries.length >= 2 ? (
          <>
            <div className="compare-results compare-results-multi" aria-live="polite">
              {selectedEntries.map((entry, index) => (
                <article className="compare-result" key={entry.id}>
                  <span className="compare-result-label">
                    Department {String.fromCharCode(65 + index)} · {entry.department}
                  </span>
                  <strong className="compare-result-value">
                    {formatCroreExact(entry.amountCrore)}
                  </strong>
                  <span className="summary-sub">
                    {formatShare(calculateShare(entry.amountCrore, totalBudgetCrore))} of listed total
                  </span>
                </article>
              ))}
            </div>
            <div className="comparison-bars" aria-label="Snapshot allocation comparison">
              {selectedEntries.map((entry, index) => (
                <div className="comparison-bar-row" key={entry.id}>
                  <div className="comparison-bar-label">
                    <span>
                      Department {String.fromCharCode(65 + index)} · {entry.department}
                    </span>
                    <span>{formatCroreExact(entry.amountCrore)}</span>
                  </div>
                  <div
                    className="comparison-track"
                    role="img"
                    aria-label={`${entry.department}: ${formatCroreExact(entry.amountCrore)}`}
                  >
                    <div
                      className={`comparison-fill${index % 2 === 1 ? " alt" : ""}`}
                      style={{
                        width: `${maxAmount > 0 ? (entry.amountCrore / maxAmount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {baseDepartment && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Compared with Department A</th>
                      <th className="numeric" scope="col">Difference (₹ crore)</th>
                      <th className="numeric" scope="col">Difference (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEntries.slice(1).map((entry) => {
                      const difference = calculateAbsoluteChange(
                        entry.amountCrore,
                        baseDepartment.amountCrore,
                      );
                      return (
                        <tr key={entry.id}>
                          <td>{entry.department}</td>
                          <td className="numeric">
                            {difference == null ? "—" : formatCroreExact(difference)}
                          </td>
                          <td className="numeric">
                            {formatPercent(
                              calculateYoY(
                                entry.amountCrore,
                                baseDepartment.amountCrore,
                              ),
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            At least two departments with budget data are needed for comparison.
          </div>
        )}
      </section>

      <section className="panel table-panel" aria-labelledby="comparison-history-title">
        <div className="panel-header">
          <div>
            <h2 className="panel-title" id="comparison-history-title">
              Historical and growth comparison
            </h2>
            <p className="panel-subtitle">Year-by-year comparison · ₹ crore</p>
          </div>
        </div>
        <div className="empty-chart" role="status">
          <strong>No historical data is available.</strong>
          This preview contains one unlabeled snapshot. A multi-year comparison
          will be available when dated budget data is supplied.
        </div>
      </section>
    </>
  );
}
