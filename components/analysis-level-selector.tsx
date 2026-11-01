"use client";

import { useLanguage } from "@/lib/i18n/provider";

export type AnalysisLevel = "departments" | "schemes";

export function AnalysisLevelSelector({
  value,
  parameter = "level",
  label = "Analysis level",
}: {
  value: AnalysisLevel;
  parameter?: "level" | "entity" | "type";
  label?: string;
}) {
  const { t } = useLanguage();

  return (
    <label className="analysis-level-picker">
      <span>{t(label)}</span>
      <select
        aria-label={t(label)}
        className="select-field compact-select"
        onChange={(event) => {
          const next = event.target.value;
          if (next !== "departments" && next !== "schemes") return;
          const url = new URL(window.location.href);
          if (next === "departments") url.searchParams.delete(parameter);
          else url.searchParams.set(parameter, next);
          window.location.assign(url.toString());
        }}
        value={value}
      >
        <option value="departments">{t("Departments")}</option>
        <option value="schemes">{t("Schemes")}</option>
      </select>
    </label>
  );
}
