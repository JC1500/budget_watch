import type { Metadata } from "next";
import Link from "next/link";

import BudgetAnalysisCharts from "@/components/budget-analysis-chart";

export const metadata: Metadata = {
  title: "Budget Analysis | Budget Watch",
  description:
    "Explore Union Government receipts, expenditure, subsidies, and deficits.",
};

export default function BudgetAnalysisPage() {
  return (
    <main className="page-shell gdp-detail-page">
      <nav className="gdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Overview</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Budget Analysis</span>
      </nav>
      <header className="gdp-detail-intro">
        <Link className="gdp-back-link" href="/">
          <span aria-hidden="true">←</span> Back to Overview
        </Link>
        <p className="eyebrow">Union Government Accounts</p>
        <h1>Budget Analysis</h1>
        <p className="intro-copy">
          Understand receipts, spending, subsidies, and the fiscal position.
        </p>
      </header>
      <BudgetAnalysisCharts />
    </main>
  );
}
