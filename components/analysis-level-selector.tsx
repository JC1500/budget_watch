"use client";

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
  return (
    <label className="analysis-level-picker">
      <span>{label}</span>
      <select
        aria-label={label}
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
        <option value="departments">Departments</option>
        <option value="schemes">Schemes</option>
      </select>
    </label>
  );
}
