"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BudgetEntry } from "@/lib/budget-data";
import { getDepartmentCagr, getDepartmentRank } from "@/lib/analytics/budget";
import { useLanguage } from "@/lib/i18n/provider";
import {
  calculateAbsoluteChange,
  calculateShare,
  calculateYoY,
  formatCroreExact,
  formatPercent,
  formatShare,
} from "@/lib/format";

const pageSize = 12;

const columns = [
  ["rank", "Rank"],
  ["department", "Department"],
  ["ministry", "Ministry"],
  ["budget", "Budget"],
  ["previous", "Previous year"],
  ["change", "Absolute change"],
  ["yoy", "YoY change"],
  ["share", "Share of total"],
  ["cagr", "CAGR"],
  ["action", "Action"],
] as const;

type ColumnKey = (typeof columns)[number][0];
type SortKey =
  | "budget-desc"
  | "budget-asc"
  | "department-asc"
  | "department-desc"
  | "increase"
  | "decrease";

type Props = {
  entries: BudgetEntry[];
  previousEntries?: BudgetEntry[];
  allRecords?: BudgetEntry[];
  years?: string[];
  explorer?: boolean;
  schemeCounts?: Record<string, number>;
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function DepartmentTable({
  entries,
  previousEntries = [],
  allRecords = entries,
  years = [],
  explorer = false,
  schemeCounts = {},
}: Props) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("budget-desc");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [minYoy, setMinYoy] = useState("");
  const [maxYoy, setMaxYoy] = useState("");
  const [minRank, setMinRank] = useState("");
  const [maxRank, setMaxRank] = useState("");
  const [topN, setTopN] = useState("all");
  const [page, setPage] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(columns.map(([key]) => key)),
  );

  const previous = useMemo(
    () => new Map(previousEntries.map((entry) => [entry.id, entry])),
    [previousEntries],
  );
  const totalBudget = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amountCrore, 0),
    [entries],
  );
  const yearQuery = entries[0]?.financialYear
    ? `?year=${encodeURIComponent(entries[0].financialYear)}`
    : "";
  const rankById = useMemo(
    () =>
      new Map(
        entries.map((entry) => [
          entry.id,
          getDepartmentRank(entry, entries),
        ]),
      ),
    [entries],
  );
  const historyById = useMemo(() => {
    const histories = new Map<string, BudgetEntry[]>();
    for (const record of allRecords) {
      const history = histories.get(record.id) ?? [];
      history.push(record);
      histories.set(record.id, history);
    }
    return histories;
  }, [allRecords]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const numberOrNull = (value: string) =>
      value.trim() === "" ? null : Number(value);
    const minimumBudget = numberOrNull(minBudget);
    const maximumBudget = numberOrNull(maxBudget);
    const minimumYoy = numberOrNull(minYoy);
    const maximumYoy = numberOrNull(maxYoy);
    const minimumRank = numberOrNull(minRank);
    const maximumRank = numberOrNull(maxRank);

    const filteredRows = entries.filter((entry) => {
      const old = previous.get(entry.id);
      const yoy = old ? calculateYoY(entry.amountCrore, old.amountCrore) : null;
      const rank = rankById.get(entry.id) ?? Number.POSITIVE_INFINITY;
      const matchesText =
        entry.department.toLocaleLowerCase().includes(normalizedQuery) ||
        entry.ministry.toLocaleLowerCase().includes(normalizedQuery);
      return (
        matchesText &&
        (minimumBudget === null || entry.amountCrore >= minimumBudget) &&
        (maximumBudget === null || entry.amountCrore <= maximumBudget) &&
        (minimumYoy === null || (yoy !== null && yoy >= minimumYoy)) &&
        (maximumYoy === null || (yoy !== null && yoy <= maximumYoy)) &&
        (minimumRank === null || rank >= minimumRank) &&
        (maximumRank === null || rank <= maximumRank)
      );
    });

    filteredRows.sort((a, b) => {
      const changeA = calculateAbsoluteChange(
        a.amountCrore,
        previous.get(a.id)?.amountCrore,
      );
      const changeB = calculateAbsoluteChange(
        b.amountCrore,
        previous.get(b.id)?.amountCrore,
      );
      switch (sortKey) {
        case "budget-asc":
          return a.amountCrore - b.amountCrore;
        case "department-asc":
          return a.department.localeCompare(b.department);
        case "department-desc":
          return b.department.localeCompare(a.department);
        case "increase":
          return (changeB ?? Number.NEGATIVE_INFINITY) -
            (changeA ?? Number.NEGATIVE_INFINITY);
        case "decrease":
          return (changeA ?? Number.POSITIVE_INFINITY) -
            (changeB ?? Number.POSITIVE_INFINITY);
        default:
          return b.amountCrore - a.amountCrore;
      }
    });

    return topN === "all" ? filteredRows : filteredRows.slice(0, Number(topN));
  }, [
    entries,
    maxBudget,
    maxRank,
    maxYoy,
    minBudget,
    minRank,
    minYoy,
    previous,
    query,
    rankById,
    sortKey,
    topN,
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
      columns.map(([, title]) => title),
      ...filtered.map((entry) => {
        const old = previous.get(entry.id);
        const change = calculateAbsoluteChange(entry.amountCrore, old?.amountCrore);
        const history = historyById.get(entry.id) ?? [];
        return [
          rankById.get(entry.id) ?? "—",
          entry.department,
          entry.ministry,
          entry.amountCrore.toFixed(2),
          old?.amountCrore.toFixed(2) ?? "—",
          change?.toFixed(2) ?? "—",
          formatPercent(old ? calculateYoY(entry.amountCrore, old.amountCrore) : null),
          formatShare(calculateShare(entry.amountCrore, totalBudget)),
          formatPercent(getDepartmentCagr(history, years)),
          "View details",
        ];
      }),
    ];
    const contents = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${contents}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budget-watch-filtered-departments.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function isVisible(key: ColumnKey) {
    return visibleColumns.has(key);
  }

  function toggleColumn(key: ColumnKey) {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="panel table-panel" aria-labelledby="department-table-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="department-table-title">
            {t(explorer ? "Explore department data" : "Department budgets")}
          </h2>
          <p className="panel-subtitle">
            {entries.length} {t("Departments").toLocaleLowerCase()} · {entries[0]?.financialYear ?? t("no year selected")}
          </p>
        </div>
        {explorer && (
          <div className="table-actions">
            <details className="column-menu">
              <summary className="secondary-button">{t("Columns")}</summary>
              <div className="column-menu-content">
                {columns.filter(([key]) => key !== "department").map(([key, title]) => (
                  <label key={key}>
                    <input
                      checked={isVisible(key)}
                      onChange={() => toggleColumn(key)}
                      type="checkbox"
                    />
                    {t(title)}
                  </label>
                ))}
              </div>
            </details>
            <button className="secondary-button" onClick={exportCsv} type="button">
              {t("Export CSV")}
            </button>
          </div>
        )}
      </div>
      <div className="table-filters">
        <label className="sr-only" htmlFor={`department-search-${explorer ? "explore" : "list"}`}>
          {t("Search departments or ministries")}
        </label>
        <input
          className="search-field"
          id={`department-search-${explorer ? "explore" : "list"}`}
          onChange={(event) => {
            setQuery(event.target.value);
            resetPage();
          }}
          placeholder={t("Search departments or ministries")}
          type="search"
          value={query}
        />
        <label className="sr-only" htmlFor={`sort-${explorer ? "explore" : "list"}`}>
          {t("Sort departments")}
        </label>
        <select
          className="select-field table-select"
          id={`sort-${explorer ? "explore" : "list"}`}
          onChange={(event) => {
            setSortKey(event.target.value as SortKey);
            resetPage();
          }}
          value={sortKey}
        >
          <option value="budget-desc">{t("Highest budget")}</option>
          <option value="budget-asc">{t("Lowest budget")}</option>
          <option value="increase">{t("Largest increase")}</option>
          <option value="decrease">{t("Largest decrease")}</option>
          <option value="department-asc">{t("Alphabetical (A–Z)")}</option>
          <option value="department-desc">{t("Alphabetical (Z–A)")}</option>
        </select>
        {explorer && (
          <>
            <label className="sr-only" htmlFor="minimum-budget">{t("Minimum budget in crore")}</label>
            <input className="search-field range-field" id="minimum-budget" min="0" onChange={(event) => { setMinBudget(event.target.value); resetPage(); }} placeholder={t("Min ₹ crore")} type="number" value={minBudget} />
            <label className="sr-only" htmlFor="maximum-budget">{t("Maximum budget in crore")}</label>
            <input className="search-field range-field" id="maximum-budget" min="0" onChange={(event) => { setMaxBudget(event.target.value); resetPage(); }} placeholder={t("Max ₹ crore")} type="number" value={maxBudget} />
            <label className="sr-only" htmlFor="minimum-yoy">{t("Minimum YoY percent")}</label>
            <input className="search-field range-field" id="minimum-yoy" onChange={(event) => { setMinYoy(event.target.value); resetPage(); }} placeholder={t("Min YoY %")} type="number" value={minYoy} />
            <label className="sr-only" htmlFor="maximum-yoy">{t("Maximum YoY percent")}</label>
            <input className="search-field range-field" id="maximum-yoy" onChange={(event) => { setMaxYoy(event.target.value); resetPage(); }} placeholder={t("Max YoY %")} type="number" value={maxYoy} />
            <label className="sr-only" htmlFor="minimum-rank">{t("Minimum rank")}</label>
            <input className="search-field rank-field" id="minimum-rank" min="1" onChange={(event) => { setMinRank(event.target.value); resetPage(); }} placeholder={t("Min rank")} type="number" value={minRank} />
            <label className="sr-only" htmlFor="maximum-rank">{t("Maximum rank")}</label>
            <input className="search-field rank-field" id="maximum-rank" min="1" onChange={(event) => { setMaxRank(event.target.value); resetPage(); }} placeholder={t("Max rank")} type="number" value={maxRank} />
            <label className="sr-only" htmlFor="top-n">{t("Limit number of rows")}</label>
            <select className="select-field table-select top-select" id="top-n" onChange={(event) => { setTopN(event.target.value); resetPage(); }} value={topN}>
              <option value="all">{t("All rows")}</option>
              <option value="10">{t("Top 10")}</option>
              <option value="20">{t("Top 20")}</option>
            </select>
          </>
        )}
      </div>
      <div className="table-wrap">
        <table className="data-table sticky-table">
          <thead>
            <tr>
              {isVisible("rank") && <th scope="col">{t("Rank")}</th>}
              <th scope="col">{t("Department")}</th>
              {isVisible("ministry") && <th scope="col">{t("Ministry")}</th>}
              {isVisible("budget") && <th className="numeric" scope="col">{t("Budget")}</th>}
              {isVisible("previous") && <th className="numeric" scope="col">{t("Previous year")}</th>}
              {isVisible("change") && <th className="numeric" scope="col">{t("Absolute change")}</th>}
              {isVisible("yoy") && <th className="numeric" scope="col">{t("YoY %")}</th>}
              {isVisible("share") && <th className="numeric" scope="col">{t("Share of total")}</th>}
              {isVisible("cagr") && <th className="numeric" scope="col">{t("CAGR")}</th>}
              {isVisible("action") && <th scope="col">{t("Action")}</th>}
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map((entry) => {
              const old = previous.get(entry.id);
              const change = calculateAbsoluteChange(entry.amountCrore, old?.amountCrore);
              const history = historyById.get(entry.id) ?? [];
              const cagr = getDepartmentCagr(history, years);
              return (
                <tr key={entry.id}>
                  {isVisible("rank") && <td>{rankById.get(entry.id) ?? "—"}</td>}
                  <td>
                    <Link className="department-link" data-i18n-skip="true" href={`/departments/${entry.id}${yearQuery}`}>{entry.department}</Link>
                    {schemeCounts[entry.id] !== undefined && (
                      <span className="department-scheme-count">
                        {schemeCounts[entry.id]} {t("schemes")}
                      </span>
                    )}
                  </td>
                  {isVisible("ministry") && <td><span className="ministry-cell" data-i18n-skip="true" title={entry.ministry}>{entry.ministry}</span></td>}
                  {isVisible("budget") && <td className="numeric">{formatCroreExact(entry.amountCrore)}</td>}
                  {isVisible("previous") && <td className="numeric">{old ? formatCroreExact(old.amountCrore) : "—"}</td>}
                  {isVisible("change") && <td className="numeric">{change === null ? "—" : formatCroreExact(change)}</td>}
                  {isVisible("yoy") && <td className="numeric">{formatPercent(old ? calculateYoY(entry.amountCrore, old.amountCrore) : null)}</td>}
                  {isVisible("share") && <td className="numeric">{formatShare(calculateShare(entry.amountCrore, totalBudget))}</td>}
                  {isVisible("cagr") && <td className="numeric">{formatPercent(cagr)}</td>}
                  {isVisible("action") && <td><Link className="text-link" href={`/departments/${entry.id}${yearQuery}`}>{t("View details")}</Link></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state" role="status">
            <strong>{t("No departments match these filters.")}</strong>
            {t("Try a different name or budget range.")}
          </div>
        )}
      </div>
      <div className="table-footer">
        <span>
          {filtered.length === 0
            ? t("0 departments")
            : `${currentPage * pageSize + 1}–${Math.min(
                (currentPage + 1) * pageSize,
                filtered.length,
              )} ${t("of")} ${filtered.length} ${t("departments")}`}
        </span>
        <div className="pagination" aria-label={t("Department table pagination")}>
          <button disabled={currentPage === 0 || filtered.length === 0} onClick={() => setPage((value) => Math.max(value - 1, 0))} type="button">{t("Previous")}</button>
          <span aria-live="polite">{pageCount === 0 ? 0 : currentPage + 1} / {pageCount}</span>
          <button disabled={currentPage >= pageCount - 1 || filtered.length === 0} onClick={() => setPage((value) => Math.min(value + 1, pageCount - 1))} type="button">{t("Next")}</button>
        </div>
      </div>
    </section>
  );
}
