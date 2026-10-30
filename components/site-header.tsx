"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { FinancialYear } from "@/lib/budget-data";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/departments", label: "Departments" },
  { href: "/compare", label: "Compare" },
  { href: "/trends", label: "Trends" },
  { href: "/explorer", label: "Explorer" },
  { href: "/data-sources", label: "Data sources" },
];

export function SiteHeader({
  years,
}: {
  years: FinancialYear[];
}) {
  const defaultYear = years.at(-1)?.year ?? "";
  const selectedYear = useSyncExternalStore(
    (callback) => {
      window.addEventListener("popstate", callback);
      return () => window.removeEventListener("popstate", callback);
    },
    () => {
      const currentYear = new URLSearchParams(window.location.search).get("year");
      return currentYear && years.some((entry) => entry.year === currentYear)
        ? currentYear
        : defaultYear;
    },
    () => defaultYear,
  );

  function navigateToYear(year: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("year", year);
    window.location.assign(url.toString());
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Budget Watch overview">
          <span className="brand-mark" aria-hidden="true">BW</span>
          <span>Budget Watch</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              className="nav-link"
              href={item.href}
              key={item.href}
              onClick={(event) => {
                const year = new URLSearchParams(window.location.search).get("year");
                if (!year) return;
                event.preventDefault();
                const url = new URL(item.href, window.location.origin);
                url.searchParams.set("year", year);
                window.location.assign(url.toString());
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <label className="year-picker">
          <span>Financial year</span>
          <select
            aria-label="Financial year"
            className="year-select"
            onChange={(event) => navigateToYear(event.target.value)}
            value={selectedYear}
          >
            {years.map((entry) => (
              <option key={entry.year} value={entry.year}>
                {entry.year}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
