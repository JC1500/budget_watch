export type BudgetMetric = {
  id: string;
  name: string;
  budget_estimates: number | null;
  actuals: number | null;
  actuals_percent_of_budget?: number | null;
  is_submetric?: boolean;
  parent_id?: string;
};

export type BudgetAnalysisData = {
  metadata: {
    financial_year: string;
    unit: string;
  };
  sections: {
    account_summary: { metrics: BudgetMetric[] };
    major_subsidies: { metrics: BudgetMetric[] };
  };
};

export type MonthlyBudgetData = {
  metadata: {
    unit: string;
    financial_years: string[];
    months: string[];
  };
  categories: Array<{
    id: string;
    name: string;
    data: Array<{
      month: string;
      values: Record<
        string,
        { monthly: number | null; year_to_date: number | null }
      >;
    }>;
  }>;
};
