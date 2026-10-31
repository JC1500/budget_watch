import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CategoryDetailView } from "@/components/category-detail-view";
import { getFinancialYears } from "@/lib/budget-data";
import {
  getBudgetCategories,
  getBudgetCategoryById,
  getBudgetCategorySummary,
  getCategoryBreakdown,
  getCategoryHistory,
} from "@/lib/data/categories";
import { calculateAbsoluteChange, calculateYoY } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string }>;
};

export function generateStaticParams() {
  return getBudgetCategories().map((category) => ({ slug: category.slug }));
}

async function CategoryDetail({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = getBudgetCategoryById(slug);
  if (!category) notFound();

  const years = getFinancialYears().map((entry) => entry.year);
  const year =
    query.year && years.includes(query.year)
      ? query.year
      : years.at(-1) ?? "";

  const summary = getBudgetCategorySummary(category.id, year);
  const history = getCategoryHistory(category.id, years);
  const breakdown = getCategoryBreakdown(category.id, year);
  const currentPoint = history.find((entry) => entry.financialYear === year);
  const yearIndex = years.indexOf(year);
  const previousYear = yearIndex > 0 ? years[yearIndex - 1] : "";
  const previousSummary = previousYear
    ? getBudgetCategorySummary(category.id, previousYear)
    : null;
  const yoy =
    currentPoint && previousSummary && previousSummary.total !== 0
      ? calculateYoY(currentPoint.total, previousSummary.total)
      : null;
  const absoluteChange =
    currentPoint && previousSummary
      ? calculateAbsoluteChange(currentPoint.total, previousSummary.total)
      : null;

  return (
    <CategoryDetailView
      absoluteChange={absoluteChange}
      breakdown={breakdown}
      category={category}
      history={history}
      previousYear={previousYear}
      summary={summary}
      year={year}
      yoy={yoy}
    />
  );
}

export default function CategoryDetailPage(props: Props) {
  return (
    <Suspense fallback={<div className="panel skeleton table-skeleton" />}>
      <CategoryDetail {...props} />
    </Suspense>
  );
}
