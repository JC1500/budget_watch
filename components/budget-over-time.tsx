"use client";

import { useState } from "react";
import { budgetEntries } from "@/lib/budget-data";

export function BudgetOverTime() {
  const [departmentId, setDepartmentId] = useState("");

  return (
    <section className="panel" aria-labelledby="budget-over-time-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="budget-over-time-title">Budget over time</h2>
          <p className="panel-subtitle">Historical allocation by department</p>
        </div>
      </div>
      <div className="trend-controls">
        <label className="field-label" htmlFor="trend-department">
          Select department
          <select
            className="select-field"
            id="trend-department"
            onChange={(event) => setDepartmentId(event.target.value)}
            value={departmentId}
          >
            <option value="">Choose a department</option>
            {budgetEntries.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.department}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="empty-chart" role="status">
        <strong>
          {departmentId
            ? "Historical data is not available for this department."
            : "Select a department to inspect its history."}
        </strong>
        A trend needs budget values for multiple labeled financial years. The
        current preview has a single allocation with no year label.
      </div>
    </section>
  );
}
