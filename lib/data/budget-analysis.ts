import accountData from "@/data/union_accounts_visual_analysis.json";
import monthlyData from "@/data/union_government_account_visualization.json";
import type {
  BudgetAnalysisData,
  MonthlyBudgetData,
} from "@/lib/types/budget-analysis";

export const budgetAnalysisData =
  accountData as BudgetAnalysisData;
export const monthlyBudgetData =
  monthlyData as MonthlyBudgetData;

export function usableMetrics(
  metrics: BudgetAnalysisData["sections"]["account_summary"]["metrics"],
) {
  return metrics.filter(
    (metric) =>
      !metric.is_submetric &&
      !metric.parent_id &&
      (metric.budget_estimates !== null ||
        metric.actuals !== null),
  );
}
