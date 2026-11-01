"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/provider";

export type DepartmentPickerOption = {
  id: string;
  name: string;
};

export function DepartmentDetailHeader({
  departments,
  selectedDepartmentId,
  selectedSchemeId,
  selectedYear,
  years,
}: {
  departments: DepartmentPickerOption[];
  selectedDepartmentId: string;
  selectedSchemeId: string;
  selectedYear: string;
  years: string[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredDepartments = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en-IN");
    if (!normalized) return departments;
    return departments.filter((department) =>
      department.name.toLocaleLowerCase("en-IN").includes(normalized),
    );
  }, [departments, query]);

  const activeDepartment =
    departments.find((department) => department.id === selectedDepartmentId) ??
    departments[0];

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  function goToDepartment(departmentId: string) {
    const params = new URLSearchParams();
    if (selectedYear) params.set("year", selectedYear);
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    router.push(`/departments/${departmentId}${suffix}`, { scroll: false });
    setOpen(false);
    setQuery("");
  }

  function handleYearChange(nextYear: string) {
    const params = new URLSearchParams();
    if (nextYear) params.set("year", nextYear);
    if (selectedSchemeId) params.set("scheme", selectedSchemeId);
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    router.push(`/departments/${selectedDepartmentId}${suffix}`, { scroll: false });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, filteredDepartments.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const candidate = filteredDepartments[highlightedIndex];
      if (candidate) goToDepartment(candidate.id);
    }
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <section className="department-header">
      <div className="department-header-topline">
        <nav className="department-breadcrumb" aria-label={t("Breadcrumb")}>
          <Link href={`/departments?year=${encodeURIComponent(selectedYear)}`} className="crumb-link">
            {t("Departments")}
          </Link>
          <span aria-hidden="true">/</span>
          <span data-i18n-skip={activeDepartment?.name ? "true" : undefined}>
            {activeDepartment?.name ?? t("Department")}
          </span>
        </nav>

        <div className="department-selector-group">
          <label className="field-stack">
            <span>{t("Department")}</span>
            <div className="combo-field" aria-expanded={open}>
              <button
                type="button"
                className="combo-trigger"
                onClick={() => setOpen((value) => !value)}
              >
                <span data-i18n-skip={activeDepartment?.name ? "true" : undefined}>
                  {activeDepartment?.name ?? t("Select department")}
                </span>
                <span aria-hidden="true">▾</span>
              </button>
              {open && (
                <div className="combo-panel" role="listbox" aria-label={t("Department selector")}>
                  <div className="combo-search-wrap">
                    <input
                      ref={inputRef}
                      className="combo-search"
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setHighlightedIndex(0);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={t("Search departments...")}
                      type="search"
                      value={query}
                    />
                  </div>
                  <div className="combo-options">
                    {filteredDepartments.length > 0 ? (
                      filteredDepartments.map((department, index) => (
                        <button
                          key={department.id}
                          type="button"
                          className={
                            `combo-option${
                              department.id === selectedDepartmentId ? " is-active" : ""
                            }${highlightedIndex === index ? " is-highlighted" : ""}`
                          }
                          onClick={() => goToDepartment(department.id)}
                          role="option"
                          aria-selected={department.id === selectedDepartmentId}
                          data-i18n-skip="true"
                        >
                          {department.name}
                        </button>
                      ))
                    ) : (
                      <div className="combo-empty">{t("No matching departments.")}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </label>

          <label className="field-stack">
            <span>{t("Financial year")}</span>
            <select
              className="select-field compact-select"
              onChange={(event) => handleYearChange(event.target.value)}
              value={selectedYear}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="department-header-main">
        <div className="department-header-title">
          <h1 data-i18n-skip={activeDepartment?.name ? "true" : undefined}>
            {activeDepartment?.name ?? t("Department")}
          </h1>
        </div>
      </div>
    </section>
  );
}
