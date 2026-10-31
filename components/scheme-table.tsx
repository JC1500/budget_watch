"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BudgetEntry, SchemeBudgetEntry } from "@/lib/budget-data";
import {
  calculateRank,
  calculateShare,
  calculateYoY,
  formatCroreExact,
  formatPercent,
  formatShare,
} from "@/lib/format";

const pageSize = 20;

type Props = {
  entries: SchemeBudgetEntry[];
  previousEntries: SchemeBudgetEntry[];
  departmentEntries: BudgetEntry[];
  departments: { id: string; name: string }[];
  years: string[];
  selectedYear: string;
  explorer?: boolean;
  departmentId?: string;
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function navigateToYear(year: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("year", year);
  window.location.assign(url.toString());
}

function descendingNullable(a: number | null, b: number | null) {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return b - a;
}

export function SchemeTable({
  entries,
  previousEntries,
  departmentEntries,
  departments,
  years,
  selectedYear,
  explorer = false,
  departmentId,
}: Props) {
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(departmentId ?? "");
  const [sortKey, setSortKey] = useState("allocation");
  const [minAllocation, setMinAllocation] = useState("");
  const [maxAllocation, setMaxAllocation] = useState("");
  const [minDepartmentShare, setMinDepartmentShare] = useState("");
  const [maxDepartmentShare, setMaxDepartmentShare] = useState("");
  const [minTotalShare, setMinTotalShare] = useState("");
  const [maxTotalShare, setMaxTotalShare] = useState("");
  const [page, setPage] = useState(0);

  const previousById = useMemo(
    () => new Map(previousEntries.map((entry) => [entry.id, entry])),
    [previousEntries],
  );
  const departmentById = useMemo(
    () => new Map(departmentEntries.map((entry) => [entry.id, entry])),
    [departmentEntries],
  );
  const totalBudget = departmentEntries.reduce(
    (total, entry) =>
      Number.isFinite(entry.amountCrore) && entry.amountCrore >= 0
        ? total + entry.amountCrore
        : total,
    0,
  );
  const ranks = useMemo(
    () => {
      const amounts = entries.map((entry) => entry.amountCrore);
      return new Map(
        entries.map((entry) => [
          entry.id,
          calculateRank(entry.amountCrore, amounts),
        ]),
      );
    },
    [entries],
  );
  const filtered = useMemo(() => {
    const numberOrNull = (value: string) =>
      value.trim() === "" ? null : Number(value);
    const minimumAllocation = numberOrNull(minAllocation);
    const maximumAllocation = numberOrNull(maxAllocation);
    const minimumDepartmentShare = numberOrNull(minDepartmentShare);
    const maximumDepartmentShare = numberOrNull(maxDepartmentShare);
    const minimumTotalShare = numberOrNull(minTotalShare);
    const maximumTotalShare = numberOrNull(maxTotalShare);
    const normalizedQuery = query.trim().toLocaleLowerCase("en-IN");
    const result = entries.filter((entry) => {
      const departmentTotal = departmentById.get(entry.departmentId)?.amountCrore;
      const shareOfDepartment =
        departmentTotal === undefined
          ? null
          : calculateShare(entry.amountCrore, departmentTotal);
      const shareOfTotal = calculateShare(entry.amountCrore, totalBudget);
      const matchesQuery =
        entry.scheme.toLocaleLowerCase("en-IN").includes(normalizedQuery) ||
        entry.department.toLocaleLowerCase("en-IN").includes(normalizedQuery) ||
        entry.ministry.toLocaleLowerCase("en-IN").includes(normalizedQuery);
      const between = (value: number | null, min: number | null, max: number | null) =>
        (min === null || (value !== null && value >= min)) &&
        (max === null || (value !== null && value <= max));
      return (
        matchesQuery &&
        (!departmentFilter || entry.departmentId === departmentFilter) &&
        between(entry.amountCrore, minimumAllocation, maximumAllocation) &&
        (!explorer ||
          (between(
            shareOfDepartment,
            minimumDepartmentShare,
            maximumDepartmentShare,
          ) &&
            between(shareOfTotal, minimumTotalShare, maximumTotalShare))) &&
        Number.isFinite(entry.amountCrore)
      );
    });

    result.sort((a, b) => {
      const previousA = previousById.get(a.id);
      const previousB = previousById.get(b.id);
      const yoyA = previousA
        ? calculateYoY(a.amountCrore, previousA.amountCrore)
        : null;
      const yoyB = previousB
        ? calculateYoY(b.amountCrore, previousB.amountCrore)
        : null;
      switch (sortKey) {
        case "allocation-asc":
          return a.amountCrore - b.amountCrore;
        case "name":
          return a.scheme.localeCompare(b.scheme);
        case "department":
          return a.department.localeCompare(b.department);
        case "share-department":
          return descendingNullable(
            calculateShare(a.amountCrore, departmentById.get(a.departmentId)?.amountCrore ?? 0),
            calculateShare(b.amountCrore, departmentById.get(b.departmentId)?.amountCrore ?? 0),
          );
        case "share-total":
          return descendingNullable(
            calculateShare(a.amountCrore, totalBudget),
            calculateShare(b.amountCrore, totalBudget),
          );
        case "yoy":
          return (yoyB ?? -Infinity) - (yoyA ?? -Infinity);
        case "rank":
          return (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity);
        default:
          return b.amountCrore - a.amountCrore;
      }
    });
    return result;
  }, [
    departmentById,
    departmentFilter,
    entries,
    explorer,
    maxAllocation,
    maxDepartmentShare,
    maxTotalShare,
    minAllocation,
    minDepartmentShare,
    minTotalShare,
    previousById,
    query,
    ranks,
    sortKey,
    totalBudget,
  ]);
  const pageCount = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const visibleEntries = filtered.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  function resetPage() {
    setPage(0);
  }

  function exportCsv() {
    const rows = [
      [
        "Financial Year",
        "Department",
        "Scheme",
        "Allocation (₹ crore)",
        "Share of Department",
        "Share of Total Budget",
        "Previous Year Allocation (₹ crore)",
        "YoY %",
        "Overall Scheme Rank",
      ],
      ...filtered.map((entry) => {
        const previous = previousById.get(entry.id);
        return [
          selectedYear,
          entry.department,
          entry.scheme,
          entry.amountCrore.toFixed(2),
          formatShare(
            calculateShare(
              entry.amountCrore,
              departmentById.get(entry.departmentId)?.amountCrore ?? 0,
            ),
          ),
          formatShare(calculateShare(entry.amountCrore, totalBudget)),
          previous?.amountCrore.toFixed(2) ?? "—",
          formatPercent(
            previous
              ? calculateYoY(entry.amountCrore, previous.amountCrore)
              : null,
          ),
          ranks.get(entry.id) ?? "—",
        ];
      }),
    ];
    const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budget-watch-filtered-schemes.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className="panel table-panel" aria-labelledby="scheme-table-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="scheme-table-title">
            {explorer ? "Explore scheme data" : "Scheme budgets"}
          </h2>
          <p className="panel-subtitle">
            {filtered.length} schemes · {selectedYear} · Scheme-level allocations only
          </p>
        </div>
        {explorer && (
          <button className="secondary-button" onClick={exportCsv} type="button">
            Export filtered CSV
          </button>
        )}
      </div>
      <div className="table-filters scheme-filters">
        <label className="sr-only" htmlFor={`scheme-search-${explorer ? "explorer" : "list"}`}>
          Search schemes or departments
        </label>
        <input
          className="search-field"
          id={`scheme-search-${explorer ? "explorer" : "list"}`}
          onChange={(event) => {
            setQuery(event.target.value);
            resetPage();
          }}
          placeholder="Search schemes or departments"
          type="search"
          value={query}
        />
        <label className="sr-only" htmlFor={`scheme-department-${explorer ? "explorer" : "list"}`}>
          Filter by department
        </label>
        <select
          className="select-field table-select"
          id={`scheme-department-${explorer ? "explorer" : "list"}`}
          onChange={(event) => {
            setDepartmentFilter(event.target.value);
            resetPage();
          }}
          value={departmentFilter}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`scheme-year-${explorer ? "explorer" : "list"}`}>
          Financial year
        </label>
        <select
          className="select-field table-select"
          id={`scheme-year-${explorer ? "explorer" : "list"}`}
          onChange={(event) => navigateToYear(event.target.value)}
          value={selectedYear}
        >
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <label className="sr-only" htmlFor={`scheme-sort-${explorer ? "explorer" : "list"}`}>
          Sort schemes
        </label>
        <select
          className="select-field table-select"
          id={`scheme-sort-${explorer ? "explorer" : "list"}`}
          onChange={(event) => {
            setSortKey(event.target.value);
            resetPage();
          }}
          value={sortKey}
        >
          <option value="allocation">Highest allocation</option>
          <option value="allocation-asc">Lowest allocation</option>
          <option value="share-department">Share of department</option>
          <option value="share-total">Share of total budget</option>
          <option value="yoy">YoY change</option>
          <option value="rank">Overall scheme rank</option>
          <option value="name">Scheme name</option>
          <option value="department">Department</option>
        </select>
        {explorer && (
          <>
            <input aria-label="Minimum allocation in crore" className="search-field range-field" onChange={(event) => { setMinAllocation(event.target.value); resetPage(); }} placeholder="Min ₹ crore" type="number" value={minAllocation} />
            <input aria-label="Maximum allocation in crore" className="search-field range-field" onChange={(event) => { setMaxAllocation(event.target.value); resetPage(); }} placeholder="Max ₹ crore" type="number" value={maxAllocation} />
            <input aria-label="Minimum share of department" className="search-field range-field" onChange={(event) => { setMinDepartmentShare(event.target.value); resetPage(); }} placeholder="Min dept %" type="number" value={minDepartmentShare} />
            <input aria-label="Maximum share of department" className="search-field range-field" onChange={(event) => { setMaxDepartmentShare(event.target.value); resetPage(); }} placeholder="Max dept %" type="number" value={maxDepartmentShare} />
            <input aria-label="Minimum share of total budget" className="search-field range-field" onChange={(event) => { setMinTotalShare(event.target.value); resetPage(); }} placeholder="Min total %" type="number" value={minTotalShare} />
            <input aria-label="Maximum share of total budget" className="search-field range-field" onChange={(event) => { setMaxTotalShare(event.target.value); resetPage(); }} placeholder="Max total %" type="number" value={maxTotalShare} />
          </>
        )}
      </div>
      <div className="table-wrap">
        <table className="data-table sticky-table scheme-data-table">
          <thead>
            <tr>
              <th scope="col">Scheme</th>
              <th scope="col">Department</th>
              <th className="numeric" scope="col">Allocation</th>
              <th className="numeric" scope="col">Share of department</th>
              <th className="numeric" scope="col">Share of total budget</th>
              <th className="numeric" scope="col">Previous year</th>
              <th className="numeric" scope="col">YoY %</th>
              <th className="numeric" scope="col">Overall rank</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map((entry) => {
              const previous = previousById.get(entry.id);
              return (
                <tr key={entry.id}>
                  <td>
                    <Link className="department-link" href={`/schemes/${encodeURIComponent(entry.id)}?year=${encodeURIComponent(selectedYear)}`}>
                      {entry.scheme}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/departments/${entry.departmentId}?year=${encodeURIComponent(selectedYear)}`}>
                      {entry.department}
                    </Link>
                  </td>
                  <td className="numeric">{formatCroreExact(entry.amountCrore)}</td>
                  <td className="numeric">{formatShare(calculateShare(entry.amountCrore, departmentById.get(entry.departmentId)?.amountCrore ?? 0))}</td>
                  <td className="numeric">{formatShare(calculateShare(entry.amountCrore, totalBudget))}</td>
                  <td className="numeric">{previous ? formatCroreExact(previous.amountCrore) : "—"}</td>
                  <td className="numeric">{formatPercent(previous ? calculateYoY(entry.amountCrore, previous.amountCrore) : null)}</td>
                  <td className="numeric">{ranks.get(entry.id) ?? "—"}</td>
                </tr>
              );
            })}
            {visibleEntries.length === 0 && (
              <tr><td className="empty-table-cell" colSpan={8}>No matching schemes have allocation data for {selectedYear}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="table-pagination" aria-label="Scheme table pages">
          <span>Page {currentPage + 1} of {pageCount}</span>
          <button className="secondary-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} type="button">Previous</button>
          <button className="secondary-button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)} type="button">Next</button>
        </div>
      )}
      <p className="ranking-caption">Share calculations use the same financial year. Scheme allocations are not added to department totals.</p>
    </section>
  );
}
