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

import {
  budgetAnalysisData,
  monthlyBudgetData,
  usableMetrics,
} from "@/lib/data/budget-analysis";
import type { BudgetMetric } from "@/lib/types/budget-analysis";

function money(value: number | null) {
  return value === null
    ? "Not available"
    : `₹${value.toLocaleString("en-IN")} crore`;
}

function MetricBars({
  metrics,
  percentage = false,
}: {
  metrics: BudgetMetric[];
  percentage?: boolean;
}) {
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
              : money(value === null ? null : Number(value)),
            key === "be" ? "Budget Estimate" : "Actuals",
          ]}
        />
        {percentage ? (
          <Bar
            dataKey="utilization"
            name="Actuals as % of BE"
            fill="var(--accent)"
            radius={[5, 5, 0, 0]}
            isAnimationActive={false}
          />
        ) : (
          <>
            <Bar
              dataKey="be"
              name="Budget Estimate"
              fill="var(--chart-selected)"
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="actuals"
              name="Actuals"
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
      title="Where Does Government Money Go?"
      description={`Budget Estimates vs actuals · ${budgetAnalysisData.metadata.unit}`}
    >
      <MetricBars metrics={metrics} />
    </Panel>
  );
}

export default function BudgetAnalysisCharts() {
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
        title="Budget Estimates vs Actuals"
        description="Major receipts and expenditure recorded against the plan"
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
        title="Tax Revenue Breakdown"
        description="Net tax revenue is the tax category available in the source"
      >
        <MetricBars metrics={accountMetrics.filter((metric) => metric.id === "tax_revenue_net")} />
      </Panel>
      <Panel
        title="Revenue Receipts Breakdown"
        description="Components shown separately; total receipts are excluded"
      >
        <MetricBars metrics={receiptMetrics} />
      </Panel>
      <Panel
        title="Major Subsidies"
        description="Budget Estimates vs actuals · individual categories only"
      >
        <MetricBars metrics={subsidyMetrics} />
      </Panel>
      <Panel
        title="Monthly Revenue and Financing Trend"
        description={`Monthly values · ${monthlyBudgetData.metadata.unit}`}
      >
        <div className="chart-controls">
          <select
            aria-label="Monthly budget category"
            value={monthlyCategory}
            onChange={(event) => setMonthlyCategory(event.target.value)}
          >
            {monthlyBudgetData.categories.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </select>
          <select
            aria-label="Monthly financial year"
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
            <Tooltip formatter={(value) => [money(Number(value)), "Monthly value"]} />
            <Line dataKey="value" name="Monthly value" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
      <Panel
        title="Budget Utilization"
        description="Actuals as a percentage of Budget Estimates"
      >
        <MetricBars metrics={utilizationMetrics} percentage />
      </Panel>
      <Panel
        title="Deficit Analysis"
        description="Reported deficit measures, without recalculating from other metrics"
      >
        <MetricBars metrics={deficitMetrics} />
      </Panel>
    </div>
  );
}
