"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BudgetEntry } from "@/lib/budget-data";
import {
  calculateAbsoluteChange,
  calculateRank,
  calculateShare,
  calculateYoY,
  formatCroreExact,
  formatPercent,
  formatShare,
} from "@/lib/format";

const pageSize = 12;

type SortKey =
  | "budget-desc"
  | "budget-asc"
  | "department-asc"
  | "department-desc";

type Props = {
  entries: BudgetEntry[];
  explorer?: boolean;
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function DepartmentTable({ entries, explorer = false }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("budget-desc");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [topN, setTopN] = useState("all");
  const [page, setPage] = useState(0);

  const totalBudget = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amountCrore, 0),
    [entries],
  );
  const rankedAmounts = useMemo(
    () => entries.map((entry) => entry.amountCrore),
    [entries],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const minimum = minBudget === "" ? null : Number(minBudget);
    const maximum = maxBudget === "" ? null : Number(maxBudget);

    const matchingEntries = entries
      .filter((entry) => {
        const matchesText =
          entry.department.toLocaleLowerCase().includes(normalizedQuery) ||
          entry.ministry.toLocaleLowerCase().includes(normalizedQuery);
        const matchesMinimum =
          minimum === null || entry.amountCrore >= minimum;
        const matchesMaximum =
          maximum === null || entry.amountCrore <= maximum;
        return matchesText && matchesMinimum && matchesMaximum;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "budget-asc":
            return a.amountCrore - b.amountCrore;
          case "department-asc":
            return a.department.localeCompare(b.department);
          case "department-desc":
            return b.department.localeCompare(a.department);
          default:
            return b.amountCrore - a.amountCrore;
        }
      });

    return topN === "all"
      ? matchingEntries
      : matchingEntries.slice(0, Number(topN));
  }, [entries, maxBudget, minBudget, query, sortKey, topN]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const visibleEntries = filtered.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  function exportCsv() {
    const rows = [
      [
        "Rank",
        "Department",
        "Ministry",
        "Budget (₹ crore)",
        "Previous year (₹ crore)",
        "Absolute change (₹ crore)",
        "YoY change (%)",
        "Share of listed total (%)",
      ],
      ...filtered.map((entry) => [
        calculateRank(entry.amountCrore, rankedAmounts),
        entry.department,
        entry.ministry,
        entry.amountCrore.toFixed(2),
        "—",
        "—",
        "—",
        (calculateShare(entry.amountCrore, totalBudget) ?? 0).toFixed(2),
      ]),
    ];
    const contents = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${contents}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budget-watch-filtered-departments.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel table-panel" aria-labelledby="department-table-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="department-table-title">
            {explorer ? "Explore department data" : "Department allocations"}
          </h2>
          <p className="panel-subtitle">
            {entries.length} departments · financial year not supplied
          </p>
        </div>
        {explorer && (
          <button className="secondary-button" onClick={exportCsv} type="button">
            Export filtered CSV
          </button>
        )}
      </div>
      <div className="table-filters">
        <label className="sr-only" htmlFor={`department-search-${explorer ? "explore" : "list"}`}>
          Search departments or ministries
        </label>
        <input
          className="search-field"
          id={`department-search-${explorer ? "explore" : "list"}`}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search departments or ministries"
          type="search"
          value={query}
        />
        <label className="sr-only" htmlFor={`sort-${explorer ? "explore" : "list"}`}>
          Sort departments
        </label>
        <select
          className="select-field table-select"
          id={`sort-${explorer ? "explore" : "list"}`}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
          value={sortKey}
        >
          <option value="budget-desc">Highest budget</option>
          <option value="budget-asc">Lowest budget</option>
          <option value="department-asc">Alphabetical (A–Z)</option>
          <option value="department-desc">Alphabetical (Z–A)</option>
        </select>
        {explorer && (
          <>
            <label className="sr-only" htmlFor="minimum-budget">Minimum budget in crore</label>
            <input
              className="search-field range-field"
              id="minimum-budget"
              min="0"
              onChange={(event) => {
                setMinBudget(event.target.value);
                setPage(0);
              }}
              placeholder="Min ₹ crore"
              type="number"
              value={minBudget}
            />
            <label className="sr-only" htmlFor="maximum-budget">Maximum budget in crore</label>
            <input
              className="search-field range-field"
              id="maximum-budget"
              min="0"
              onChange={(event) => {
                setMaxBudget(event.target.value);
                setPage(0);
              }}
              placeholder="Max ₹ crore"
              type="number"
              value={maxBudget}
            />
            <label className="sr-only" htmlFor="top-n">Limit number of rows</label>
            <select
              className="select-field table-select top-select"
              id="top-n"
              onChange={(event) => {
                setTopN(event.target.value);
                setPage(0);
              }}
              value={topN}
            >
              <option value="all">All rows</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
            </select>
          </>
        )}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Department</th>
              <th scope="col">Ministry</th>
              <th className="numeric" scope="col">Budget</th>
              <th className="numeric" scope="col">Previous year</th>
              <th className="numeric" scope="col">Absolute change</th>
              <th className="numeric" scope="col">YoY change</th>
              <th className="numeric" scope="col">Share of total</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map((entry) => {
              const absoluteChange = calculateAbsoluteChange(entry.amountCrore);
              return (
                <tr key={entry.id}>
                  <td>{calculateRank(entry.amountCrore, rankedAmounts)}</td>
                  <td>
                    <Link className="department-link" href={`/departments/${entry.id}`}>
                      {entry.department}
                    </Link>
                  </td>
                  <td>
                    <span className="ministry-cell" title={entry.ministry}>
                      {entry.ministry}
                    </span>
                  </td>
                  <td className="numeric">{formatCroreExact(entry.amountCrore)}</td>
                  <td className="numeric">—</td>
                  <td className="numeric">
                    {absoluteChange == null ? "—" : formatCroreExact(absoluteChange)}
                  </td>
                  <td className="numeric">
                    {formatPercent(calculateYoY(entry.amountCrore))}
                  </td>
                  <td className="numeric">
                    {formatShare(calculateShare(entry.amountCrore, totalBudget))}
                  </td>
                  <td>
                    <Link className="text-link" href={`/departments/${entry.id}`}>
                      View details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state" role="status">
            <strong>No departments match these filters.</strong>
            Try a different name or budget range.
          </div>
        )}
      </div>
      <div className="table-footer">
        <span>
          {filtered.length === 0
            ? "0 departments"
            : `${currentPage * pageSize + 1}–${Math.min(
                (currentPage + 1) * pageSize,
                filtered.length,
              )} of ${filtered.length} departments`}
        </span>
        <div className="pagination" aria-label="Department table pagination">
          <button
            disabled={currentPage === 0 || filtered.length === 0}
            onClick={() => setPage((value) => Math.max(value - 1, 0))}
            type="button"
          >
            Previous
          </button>
          <span aria-live="polite">
            {pageCount === 0 ? 0 : currentPage + 1} / {pageCount}
          </span>
          <button
            disabled={currentPage >= pageCount - 1 || filtered.length === 0}
            onClick={() => setPage((value) => Math.min(value + 1, pageCount - 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
