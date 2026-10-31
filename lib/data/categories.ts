import rawCategories from "@/data/budgetwatch_categories.json";
import {
  budgetRecords,
  getDepartment,
  getBudgetsByYear,
  getTotalBudget,
  normalizeDepartmentName,
  slugify,
} from "@/lib/budget-data";
import { calculateBudgetShare } from "@/lib/format";
import type { BudgetEntry } from "@/lib/budget-data";

type RawCategoryDepartment = {
  ministry?: string;
  department?: string;
};

type RawCategoryDefinition = {
  id?: string;
  name?: string;
  departments?: RawCategoryDepartment[];
};

export type BudgetCategoryDepartment = {
  ministry: string;
  department: string;
  departmentId: string | null;
  displayName: string;
};

export type BudgetCategory = {
  id: string;
  name: string;
  slug: string;
  departments: BudgetCategoryDepartment[];
  unmatchedDepartments: Array<{ ministry: string; department: string }>;
  departmentIds: string[];
};

export type BudgetCategorySummary = {
  id: string;
  slug: string;
  name: string;
  total: number;
  departmentCount: number;
  shareOfTotal: number | null;
  departments: string[];
};

export type CategoryDepartmentBreakdown = {
  departmentId: string;
  department: string;
  ministry: string;
  amountCrore: number;
  shareOfCategory: number | null;
  shareOfTotal: number | null;
};

const categories =
  Array.isArray((rawCategories as { categories?: RawCategoryDefinition[] }).categories)
    ? (rawCategories as { categories: RawCategoryDefinition[] }).categories
    : [];

const departmentLookup = new Map<string, string>();
for (const record of budgetRecords) {
  const seen = new Set<string>([
    normalizeDepartmentName(record.department),
    slugify(record.department),
    record.department.trim().toLocaleLowerCase("en-IN"),
  ]);
  for (const key of seen) {
    if (key && !departmentLookup.has(key)) {
      departmentLookup.set(key, record.id);
    }
  }
}

function resolveDepartmentId(name: string | undefined) {
  if (!name) return null;
  const direct = normalizeDepartmentName(name);
  return departmentLookup.get(direct) ?? departmentLookup.get(slugify(name)) ?? null;
}

function buildCategory(rawCategory: RawCategoryDefinition): BudgetCategory {
  const departments = Array.isArray(rawCategory.departments) ? rawCategory.departments : [];
  const prepared = departments.map((entry) => {
    const department = entry.department ?? "";
    const departmentId = resolveDepartmentId(department);
    const displayName = departmentId ? getDepartment(departmentId)?.department ?? department : department;
    return {
      ministry: entry.ministry ?? "",
      department,
      departmentId,
      displayName,
    };
  });

  const departmentIds = prepared
    .map((entry) => entry.departmentId)
    .filter((value): value is string => value !== null);

  const unmatchedDepartments = prepared
    .filter((entry) => entry.departmentId === null)
    .map((entry) => ({
      ministry: entry.ministry,
      department: entry.department,
    }));

  return {
    id: rawCategory.id ?? `category-${Math.random().toString(36).slice(2, 9)}`,
    name: rawCategory.name ?? "Untitled category",
    slug:
      rawCategory.id ??
      rawCategory.name?.trim()
        .toLocaleLowerCase("en-IN")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ??
      "untitled-category",
    departments: prepared,
    unmatchedDepartments,
    departmentIds,
  };
}

export const budgetCategories = categories.map(buildCategory);

export function getBudgetCategories() {
  return budgetCategories;
}

export function getBudgetCategoryById(id: string) {
  return budgetCategories.find((category) => category.id === id || category.slug === id) ?? null;
}

export function getBudgetCategorySummary(categoryId: string, financialYear: string): BudgetCategorySummary | null {
  const category = getBudgetCategoryById(categoryId);
  if (!category) return null;
  const entries = category.departmentIds
    .map((departmentId) => getDepartment(departmentId, financialYear))
    .filter((entry): entry is BudgetEntry => entry !== undefined && entry !== null);
  const total = entries.reduce((sum, entry) => sum + entry.amountCrore, 0);
  const totalBudget = getTotalBudget(financialYear);
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    total,
    departmentCount: entries.length,
    shareOfTotal: totalBudget > 0 ? calculateBudgetShare(total, totalBudget) : null,
    departments: entries.map((entry) => entry.department),
  };
}

export function getBudgetCategorySummaries(financialYear: string) {
  return budgetCategories
    .map((category) => getBudgetCategorySummary(category.id, financialYear))
    .filter((entry): entry is BudgetCategorySummary => entry !== null)
    .sort((a, b) => b.total - a.total);
}

export function getCategoryHistory(categoryId: string, financialYears: string[]) {
  const category = getBudgetCategoryById(categoryId);
  if (!category) return [];
  const categoryIds = new Set(category.departmentIds);
  return financialYears.map((financialYear) => {
    const yearEntries = getBudgetsByYear(financialYear).filter((entry) => categoryIds.has(entry.id));
    const total = yearEntries.reduce((sum, entry) => sum + entry.amountCrore, 0);
    const totalBudget = getTotalBudget(financialYear);
    return {
      financialYear,
      total,
      departmentCount: yearEntries.length,
      shareOfTotal: totalBudget > 0 ? calculateBudgetShare(total, totalBudget) : null,
    };
  });
}

export function getCategoryBreakdown(categoryId: string, financialYear: string) {
  const category = getBudgetCategoryById(categoryId);
  if (!category) return [];
  const total = getBudgetCategorySummary(category.id, financialYear)?.total ?? 0;
  const totalBudget = getTotalBudget(financialYear);
  const rows = category.departmentIds
    .map((departmentId) => getDepartment(departmentId, financialYear))
    .filter((entry): entry is BudgetEntry => entry !== undefined && entry !== null)
    .map((entry) => ({
      departmentId: entry.id,
      department: entry.department,
      ministry: entry.ministry,
      amountCrore: entry.amountCrore,
      shareOfCategory: total > 0 ? calculateBudgetShare(entry.amountCrore, total) : null,
      shareOfTotal: totalBudget > 0 ? calculateBudgetShare(entry.amountCrore, totalBudget) : null,
    }));

  return rows.sort((a, b) => b.amountCrore - a.amountCrore);
}
