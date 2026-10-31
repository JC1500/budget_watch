"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type SchemePickerOption = {
  id: string;
  name: string;
  department: string;
  departmentId: string;
};

export function SchemeDetailHeader({
  schemes,
  selectedSchemeId,
  selectedYear,
  years,
}: {
  schemes: SchemePickerOption[];
  selectedSchemeId: string;
  selectedYear: string;
  years: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en-IN");
    return schemes.filter((scheme) =>
      `${scheme.name} ${scheme.department}`
        .toLocaleLowerCase("en-IN")
        .includes(normalized),
    );
  }, [query, schemes]);
  const active = schemes.find((scheme) => scheme.id === selectedSchemeId);

  function navigate(schemeId: string, year = selectedYear) {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    router.push(`/schemes/${encodeURIComponent(schemeId)}?${params.toString()}`, { scroll: false });
    setOpen(false);
    setQuery("");
  }

  return (
    <section className="department-header scheme-header">
      <div className="department-header-topline">
        <nav className="department-breadcrumb" aria-label="Breadcrumb">
          <Link className="crumb-link" href={`/schemes?year=${encodeURIComponent(selectedYear)}`}>Schemes</Link>
          <span aria-hidden="true">/</span>
          <span>{active?.name ?? "Scheme"}</span>
        </nav>
        <div className="department-selector-group">
          <label className="field-stack">
            <span>Scheme</span>
            <div className="combo-field" aria-expanded={open}>
              <button className="combo-trigger" onClick={() => setOpen((value) => !value)} type="button">
                <span>{active?.name ?? "Select scheme"}</span>
                <span aria-hidden="true">▾</span>
              </button>
              {open && (
                <div className="combo-panel" role="listbox" aria-label="Scheme selector">
                  <div className="combo-search-wrap">
                    <input
                      autoFocus
                      className="combo-search"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search schemes or departments..."
                      type="search"
                      value={query}
                    />
                  </div>
                  <div className="combo-options">
                    {filtered.length > 0 ? filtered.map((scheme) => (
                      <button
                        aria-selected={scheme.id === selectedSchemeId}
                        className={`combo-option${scheme.id === selectedSchemeId ? " is-active" : ""}`}
                        key={scheme.id}
                        onClick={() => navigate(scheme.id)}
                        role="option"
                        type="button"
                      >
                        <span>{scheme.name}</span>
                        <small>{scheme.department}</small>
                      </button>
                    )) : <div className="combo-empty">No matching schemes.</div>}
                  </div>
                </div>
              )}
            </div>
          </label>
          <label className="field-stack">
            <span>Financial year</span>
            <select
              className="select-field compact-select"
              onChange={(event) => navigate(selectedSchemeId, event.target.value)}
              value={selectedYear}
            >
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="department-header-main">
        <div className="department-header-title">
          <h1>{active?.name ?? "Scheme"}</h1>
          {active && <Link className="scheme-parent-link" href={`/departments/${active.departmentId}?year=${encodeURIComponent(selectedYear)}`}>Department: {active.department}</Link>}
        </div>
      </div>
    </section>
  );
}
