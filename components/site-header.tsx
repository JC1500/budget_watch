"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { BudgetEntity, FinancialYear } from "@/lib/budget-data";
import { useLanguage } from "@/lib/i18n/provider";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/departments", label: "Departments" },
  { href: "/schemes", label: "Schemes" },
  { href: "/compare", label: "Compare" },
  { href: "/trends", label: "Trends" },
  { href: "/explorer", label: "Explorer" },
  { href: "/data-sources", label: "Data Sources" },
];

export function SiteHeader({
  years,
  entities,
}: {
  years: FinancialYear[];
  entities: BudgetEntity[];
}) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const defaultYear = years.at(-1)?.year ?? "";
  const showGlobalSearch = pathname !== "/";
  const isDepartmentDetail = pathname.startsWith("/departments/") && pathname !== "/departments";
  const isSchemeDetail = pathname.startsWith("/schemes/");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase("en-IN");
  const searchResults = normalizedSearch
    ? entities
        .filter((entity) =>
          `${entity.name} ${entity.departmentName ?? ""}`
            .toLocaleLowerCase("en-IN")
            .includes(normalizedSearch),
        )
        .slice(0, 8)
    : [];
  const theme = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => callback();

      const handleThemeChange = () => callback();
      window.addEventListener("storage", handleThemeChange);
      window.addEventListener("budget-watch-theme", handleThemeChange);

      if ("addEventListener" in mediaQuery) {
        mediaQuery.addEventListener("change", handleChange);
        return () => {
          window.removeEventListener("storage", handleThemeChange);
          window.removeEventListener("budget-watch-theme", handleThemeChange);
          mediaQuery.removeEventListener("change", handleChange);
        };
      }

      const legacyMediaQuery = mediaQuery as MediaQueryList & {
        addListener: (listener: (event: MediaQueryListEvent) => void) => void;
        removeListener: (listener: (event: MediaQueryListEvent) => void) => void;
      };

      legacyMediaQuery.addListener(handleChange);
      return () => {
        window.removeEventListener("storage", handleThemeChange);
        window.removeEventListener("budget-watch-theme", handleThemeChange);
        legacyMediaQuery.removeListener(handleChange);
      };
    },
    () => {
      if (typeof window === "undefined") {
        return "light";
      }

      const stored = window.localStorage.getItem("budget-watch-theme");
      if (stored === "dark" || stored === "light") {
        return stored;
      }

      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    },
    () => "light",
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("budget-watch-theme", theme);
    }
  }, [theme]);

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
        <Link className="brand" href="/" aria-label={t("Budget Watch overview")}>
          <span className="brand-mark" aria-hidden="true">BW</span>
          <span>Budget Watch</span>
        </Link>
        <nav className="main-nav" aria-label={t("Main navigation")}>
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
              {t(item.label)}
            </Link>
          ))}
        </nav>
        {showGlobalSearch && (
          <div className="global-search">
            <label className="sr-only" htmlFor="global-budget-search">{t("Search departments and schemes")}</label>
            <input
              autoComplete="off"
              className="global-search-input"
              id="global-budget-search"
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder={t("Search budgets…")}
              type="search"
              value={searchQuery}
            />
            {searchOpen && normalizedSearch && (
              <div className="global-search-results" role="listbox" aria-label={t("Search results")}>
                {searchResults.length > 0 ? searchResults.map((entity) => (
                  <Link
                    className="global-search-result"
                    href={entity.type === "department" ? `/departments/${entity.id}` : `/schemes/${encodeURIComponent(entity.id)}`}
                    key={`${entity.type}:${entity.id}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                    role="option"
                  >
                    <span>
                      <strong data-i18n-skip="true">{entity.name}</strong>
                      {entity.type === "scheme" && entity.departmentName && (
                        <small data-i18n-skip="true">{entity.departmentName}</small>
                      )}
                    </span>
                    <small className="search-result-type">
                      {entity.type === "department" ? t("Department") : t("Scheme")}
                    </small>
                  </Link>
                )) : (
                  <div className="combo-empty">{t("No departments or schemes found.")}</div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="header-actions">
          <button
            aria-label={t(language === "en" ? "Switch language to Hindi" : "Switch language to English")}
            className="language-toggle"
            data-i18n-skip="true"
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            type="button"
          >
            {language === "en" ? "हिन्दी" : "English"}
          </button>
          <button
            aria-label={t(theme === "light" ? "Switch to dark mode" : "Switch to light mode")}
            className="theme-toggle"
            onClick={() => {
              const nextTheme = theme === "light" ? "dark" : "light";
              if (typeof window !== "undefined") {
                window.localStorage.setItem("budget-watch-theme", nextTheme);
                window.dispatchEvent(new Event("budget-watch-theme"));
              }
            }}
            type="button"
          >
            <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
          </button>
          {!isDepartmentDetail && !isSchemeDetail && (
            <label className="year-picker">
              <span>{t("Financial year")}</span>
              <select
                aria-label={t("Financial year")}
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
          )}
        </div>
      </div>
    </header>
  );
}
