"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLanguage } from "@/lib/i18n/provider";
import {
  budgetAnalysisData,
  monthlyBudgetData,
  usableMetrics,
} from "@/lib/data/budget-analysis";
import type { BudgetMetric } from "@/lib/types/budget-analysis";

function money(value: number | null, t: (key: string) => string) {
  return value === null
    ? t("Not available")
    : `₹${value.toLocaleString("en-IN")} crore`;
}

function MetricBars({
  metrics,
  percentage = false,
}: {
  metrics: BudgetMetric[];
  percentage?: boolean;
}) {
  const { t } = useLanguage();
  const data = metrics.map((metric) => ({
    name: metric.name,
    be: metric.budget_estimates,
    actuals: metric.actuals,
    utilization: metric.actuals_percent_of_budget ?? null,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ bottom: 56, left: 12 }}>
        <CartesianGrid
          stroke="var(--chart-grid)"
          strokeDasharray="3 4"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          angle={-30}
          textAnchor="end"
          interval={0}
          height={90}
        />
        <YAxis
          tickFormatter={(value: number) =>
            percentage ? `${value}%` : value.toLocaleString("en-IN")
          }
        />
        <Tooltip
          formatter={(value, key) => [
            percentage
              ? `${Number(value).toFixed(1)}%`
              : money(value === null ? null : Number(value), t),
              t(key === "be" ? "Budget Estimate" : "Actuals"),
          ]}
        />
        {percentage ? (
          <Bar
            dataKey="utilization"
            name={t("Actuals as % of BE")}
            fill="var(--accent)"
            radius={[5, 5, 0, 0]}
            isAnimationActive={false}
          />
        ) : (
          <>
            <Bar
              dataKey="be"
              name={t("Budget Estimate")}
              fill="var(--chart-selected)"
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="actuals"
              name={t("Actuals")}
              fill="var(--accent)"
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
            />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-subtitle">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function BudgetOverviewChart() {
  const { t } = useLanguage();
  const metrics = usableMetrics(
    budgetAnalysisData.sections.account_summary.metrics,
  ).filter((metric) =>
    [
      "revenue_receipts",
      "tax_revenue_net",
      "revenue_expenditure",
      "capital_expenditure",
      "total_expenditure",
    ].includes(metric.id),
  );

  return (
    <Panel
      title={t("Where Does Government Money Go?")}
      description={`${t("Budget Estimates vs actuals")} · ${t(budgetAnalysisData.metadata.unit)}`}
    >
      <MetricBars metrics={metrics} />
    </Panel>
  );
}

export default function BudgetAnalysisCharts() {
  const { t } = useLanguage();
  const accountMetrics = usableMetrics(
    budgetAnalysisData.sections.account_summary.metrics,
  );
  const subsidyMetrics = budgetAnalysisData.sections.major_subsidies.metrics
    .filter((metric) => metric.id !== "total_major_subsidies");
  const deficitMetrics = accountMetrics.filter((metric) =>
    ["fiscal_deficit", "revenue_deficit", "primary_deficit"].includes(
      metric.id,
    ),
  );
  const receiptMetrics = accountMetrics.filter((metric) =>
    [
      "tax_revenue_net",
      "non_tax_revenue",
      "non_debt_capital_receipts",
      "recovery_of_loans",
      "other_receipts",
    ].includes(metric.id),
  );
  const utilizationMetrics = accountMetrics.filter(
    (metric) => metric.actuals_percent_of_budget !== null &&
      metric.actuals_percent_of_budget !== undefined,
  );
  const [monthlyCategory, setMonthlyCategory] = useState(
    monthlyBudgetData.categories[0]?.id ?? "",
  );
  const [monthlyYear, setMonthlyYear] = useState(
    monthlyBudgetData.metadata.financial_years[0] ?? "",
  );
  const category = monthlyBudgetData.categories.find(
    (entry) => entry.id === monthlyCategory,
  );
  const monthlyChartData = useMemo(
    () =>
      category?.data.flatMap((entry) => {
        const value = entry.values[monthlyYear]?.monthly;
        return value === null || value === undefined
          ? []
          : [{ month: entry.month, value }];
      }) ?? [],
    [category, monthlyYear],
  );

  return (
    <div className="inflation-history-charts">
      <Panel
        title={t("Budget Estimates vs Actuals")}
        description={t("Major receipts and expenditure recorded against the plan")}
      >
        <MetricBars metrics={accountMetrics.filter((metric) =>
          [
            "revenue_receipts",
            "tax_revenue_net",
            "non_tax_revenue",
            "revenue_expenditure",
            "capital_expenditure",
            "total_expenditure",
          ].includes(metric.id),
        )} />
      </Panel>
      <Panel
        title={t("Tax Revenue Breakdown")}
        description={t("Net tax revenue is the tax category available in the source")}
      >
        <MetricBars metrics={accountMetrics.filter((metric) => metric.id === "tax_revenue_net")} />
      </Panel>
      <Panel
        title={t("Revenue Receipts Breakdown")}
        description={t("Components shown separately; total receipts are excluded")}
      >
        <MetricBars metrics={receiptMetrics} />
      </Panel>
      <Panel
        title={t("Major Subsidies")}
        description={t("Budget Estimates vs actuals · individual categories only")}
      >
        <MetricBars metrics={subsidyMetrics} />
      </Panel>
      <Panel
        title={t("Monthly Revenue and Financing Trend")}
        description={`${t("Monthly values")} · ${t(monthlyBudgetData.metadata.unit)}`}
      >
        <div className="chart-controls">
          <select
            aria-label={t("Monthly budget category")}
            value={monthlyCategory}
            onChange={(event) => setMonthlyCategory(event.target.value)}
          >
            {monthlyBudgetData.categories.map((entry) => (
              <option data-i18n-skip="true" key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </select>
          <select
            aria-label={t("Monthly financial year")}
            value={monthlyYear}
            onChange={(event) => setMonthlyYear(event.target.value)}
          >
            {monthlyBudgetData.metadata.financial_years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={monthlyChartData}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value: number) => value.toLocaleString("en-IN")} />
            <Tooltip formatter={(value) => [money(Number(value), t), t("Monthly value")]} />
            <Line dataKey="value" name={t("Monthly value")} stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
      <Panel
        title={t("Budget Utilization")}
        description={t("Actuals as a percentage of Budget Estimates")}
      >
        <MetricBars metrics={utilizationMetrics} percentage />
      </Panel>
      <Panel
        title={t("Deficit Analysis")}
        description={t("Reported deficit measures, without recalculating from other metrics")}
      >
        <MetricBars metrics={deficitMetrics} />
      </Panel>
    </div>
  );
}
