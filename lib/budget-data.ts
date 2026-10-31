import "server-only";

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { calculateBudgetShare } from "@/lib/format";

type RawDepartment = {
  department?: unknown;
  total?: unknown;
  schemes?: unknown;
};

type RawScheme = {
  scheme?: unknown;
  budget?: unknown;
};

type RawMinistry = {
  ministry?: unknown;
  departments?: unknown;
};

type RawBudgetFile = {
  year?: unknown;
  financial_year?: unknown;
  unit?: unknown;
  ministries?: unknown;
};

export type FinancialYear = {
  year: string;
  filename: string;
  unit: string;
  recordCount: number;
  schemeCount: number;
  availableFields: string[];
};

export type BudgetEntry = {
  id: string;
  financialYear: string;
  ministry: string;
  department: string;
  amountCrore: number;
};

export type BudgetEntityType = "department" | "scheme";

export type BudgetEntity = {
  id: string;
  name: string;
  type: BudgetEntityType;
  departmentId?: string;
  departmentName?: string;
};

export type SchemeBudgetEntry = {
  id: string;
  financialYear: string;
  scheme: string;
  departmentId: string;
  department: string;
  ministry: string;
  amountCrore: number;
};

export type DataStatus = {
  errors: string[];
  invalidRecords: number;
  isEmpty: boolean;
};

const departmentAliases: Record<string, string> = {
  "department of agriculture cooperation and farmers welfare":
    "department of agriculture and farmers welfare",
  "department of agriculture, cooperation and farmers' welfare":
    "department of agriculture and farmers welfare",
  "ministry of ayurveda yoga and naturopathy unani siddha and homoeopathy":
    "ministry of ayush",
  "ministry of ayurveda, yoga and naturopathy, unani, siddha and homoeopathy":
    "ministry of ayush",
};

export function normalizeDepartmentName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/g, "")
    .toLocaleLowerCase("en-IN");
}

export function getSchemeShareOfDepartment(
  schemeId: string,
  financialYear: string,
) {
  const scheme = getScheme(schemeId, financialYear);
  const departmentTotal = scheme
    ? getDepartmentTotal(scheme.departmentId, financialYear)
    : null;
  return scheme && departmentTotal !== null
    ? calculateBudgetShare(scheme.amountCrore, departmentTotal)
    : null;
}

export function getSchemeShareOfTotal(
  schemeId: string,
  financialYear: string,
) {
  const allocation = getSchemeAllocation(schemeId, financialYear);
  const total = getTotalBudget(financialYear);
  return allocation === null || total <= 0
    ? null
    : calculateBudgetShare(allocation, total);
}

function departmentIdentity(name: string) {
  const normalized = normalizeDepartmentName(name);
  return departmentAliases[normalized] ?? normalized;
}

export function slugify(value: string) {
  return departmentIdentity(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value.replace(/[₹,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSchemeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");
}

function schemeIdentity(departmentId: string, name: string) {
  const identity = `${departmentId}\u0000${normalizeSchemeName(name)}`;
  const hash = createHash("sha256").update(identity).digest("hex").slice(0, 24);
  return `scheme-${hash}`;
}

function objectRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (record): record is Record<string, unknown> =>
          record !== null && typeof record === "object" && !Array.isArray(record),
      )
    : [];
}

function normalizeFile(filename: string, rawFile: RawBudgetFile) {
  const year =
    typeof rawFile.year === "string"
      ? rawFile.year.trim()
      : typeof rawFile.financial_year === "string"
        ? rawFile.financial_year.trim()
        : "";
  const unit =
    typeof rawFile.unit === "string" ? rawFile.unit.trim() : "₹ crore";
  const records: BudgetEntry[] = [];
  const schemes: SchemeBudgetEntry[] = [];
  let invalidRecords = 0;

  for (const rawMinistry of objectRecords(rawFile.ministries) as RawMinistry[]) {
    const ministry =
      typeof rawMinistry.ministry === "string"
        ? rawMinistry.ministry.trim().replace(/\s+/g, " ")
        : "";
    for (const rawDepartment of objectRecords(
      rawMinistry.departments,
    ) as RawDepartment[]) {
      if (typeof rawDepartment.department !== "string") {
        invalidRecords += 1;
        continue;
      }
      const department = rawDepartment.department.trim().replace(/\s+/g, " ");
      const amountCrore = readAmount(rawDepartment.total);
      if (!department || !year || !ministry) {
        invalidRecords += 1;
        continue;
      }
      const departmentId = slugify(department);
      if (amountCrore === null) {
        invalidRecords += 1;
      } else {
        records.push({
          id: departmentId,
          financialYear: year,
          ministry,
          department,
          amountCrore,
        });
      }

      const schemeAmounts = new Map<string, {
        id: string;
        scheme: string;
        amountCrore: number;
      }>();
      for (const rawScheme of objectRecords(rawDepartment.schemes) as RawScheme[]) {
        if (typeof rawScheme.scheme !== "string") {
          invalidRecords += 1;
          continue;
        }
        const scheme = rawScheme.scheme.trim().replace(/\s+/g, " ");
        const schemeAmount = readAmount(rawScheme.budget);
        if (!scheme || schemeAmount === null) {
          invalidRecords += 1;
          continue;
        }
        const id = schemeIdentity(departmentId, scheme);
        const existing = schemeAmounts.get(id);
        if (existing) {
          existing.amountCrore += schemeAmount;
        } else {
          schemeAmounts.set(id, { id, scheme, amountCrore: schemeAmount });
        }
      }
      for (const scheme of schemeAmounts.values()) {
        schemes.push({
          ...scheme,
          financialYear: year,
          departmentId,
          department,
          ministry,
        });
      }
    }
  }

  return { filename, year, unit, records, schemes, invalidRecords };
}

function loadFiles() {
  const files: ReturnType<typeof normalizeFile>[] = [];
  const errors: string[] = [];
  try {
    const filenames = readdirSync(join(process.cwd(), "data"))
      .filter((filename) => filename.toLowerCase().endsWith(".json"))
      .sort();
    if (filenames.length === 0) errors.push("No JSON budget files were found in data/.");
    for (const filename of filenames) {
      try {
        const content = readFileSync(join(process.cwd(), "data", filename), "utf8");
        const parsed = JSON.parse(content) as RawBudgetFile;
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          (typeof parsed.year !== "string" &&
            typeof parsed.financial_year !== "string") ||
          !Array.isArray(parsed.ministries)
        ) {
          errors.push(`${filename}: required budget data fields are missing.`);
          continue;
        }
        files.push(normalizeFile(filename, parsed));
      } catch {
        errors.push(`${filename}: the data file could not be read.`);
      }
    }
  } catch {
    errors.push("The local budget data folder could not be read.");
  }
  return {
    files: files
      .filter((file) => file.year !== "")
      .sort((a, b) => a.year.localeCompare(b.year)),
    errors,
  };
}

const loaded = loadFiles();
export const budgetRecords = loaded.files.flatMap((file) => file.records);
export const schemeRecords = loaded.files.flatMap((file) => file.schemes);

const displayNames = new Map<string, string>();
for (const record of budgetRecords) {
  displayNames.set(departmentIdentity(record.department), record.department);
}

export function getFinancialYears(): FinancialYear[] {
  return loaded.files.map((file) => ({
    year: file.year,
    filename: file.filename,
    unit: file.unit,
    recordCount: file.records.length,
    schemeCount: file.schemes.length,
    availableFields: ["ministry", "department", "total", "schemes"],
  }));
}

export function getBudgetsByYear(year: string): BudgetEntry[] {
  return budgetRecords.filter((record) => record.financialYear === year);
}

export function getSchemesByYear(year: string): SchemeBudgetEntry[] {
  return schemeRecords.filter((record) => record.financialYear === year);
}

export function getSchemes(year = getFinancialYears().at(-1)?.year ?? "") {
  return getSchemesByYear(year);
}

export function getSchemesByDepartment(
  departmentId: string,
  year?: string,
): SchemeBudgetEntry[] {
  return schemeRecords.filter(
    (record) =>
      record.departmentId === departmentId &&
      (year === undefined || record.financialYear === year),
  );
}

export function getSchemeHistory(id: string): SchemeBudgetEntry[] {
  return schemeRecords
    .filter((record) => record.id === id)
    .sort((a, b) => a.financialYear.localeCompare(b.financialYear));
}

export function getBudgetEntities(): BudgetEntity[] {
  const departments = [
    ...new Map(
      budgetRecords.map((record) => [
        record.id,
        { id: record.id, name: record.department, type: "department" as const },
      ]),
    ).values(),
  ];
  const schemes = [
    ...new Map(
      schemeRecords.map((record) => [
        record.id,
        {
          id: record.id,
          name: record.scheme,
          type: "scheme" as const,
          departmentId: record.departmentId,
          departmentName: record.department,
        },
      ]),
    ).values(),
  ];
  return [...departments, ...schemes].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getScheme(id: string, year?: string) {
  const history = getSchemeHistory(id);
  return year
    ? history.find((record) => record.financialYear === year)
    : history.at(-1);
}

export function getSchemeCountsByDepartment(financialYear: string) {
  const counts: Record<string, number> = Object.fromEntries(
    getDepartments(financialYear).map((entry) => [entry.id, 0]),
  );
  for (const scheme of getSchemesByYear(financialYear)) {
    counts[scheme.departmentId] = (counts[scheme.departmentId] ?? 0) + 1;
  }
  return counts;
}

export function getDepartmentTotal(
  departmentId: string,
  financialYear: string,
) {
  return budgetRecords.find(
    (record) =>
      record.id === departmentId && record.financialYear === financialYear,
  )?.amountCrore ?? null;
}

export function getTotalBudget(financialYear: string) {
  return getDepartments(financialYear).reduce(
    (total, entry) =>
      Number.isFinite(entry.amountCrore) && entry.amountCrore >= 0
        ? total + entry.amountCrore
        : total,
    0,
  );
}

export function getSchemeAllocation(id: string, financialYear: string) {
  return getScheme(id, financialYear)?.amountCrore ?? null;
}

export function getDepartments(year = getFinancialYears().at(-1)?.year ?? "") {
  const seen = new Set<string>();
  return getBudgetsByYear(year)
    .filter((record) => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    })
    .map((record) => ({
      ...record,
      department:
        displayNames.get(departmentIdentity(record.department)) ??
        record.department,
    }));
}

export function getDepartmentHistory(idOrName: string): BudgetEntry[] {
  const identity = departmentIdentity(idOrName);
  const targetId = slugify(idOrName);
  return budgetRecords
    .filter(
      (record) =>
        departmentIdentity(record.department) === identity ||
        record.id === targetId,
    )
    .map((record) => ({
      ...record,
      id: targetId,
      department:
        displayNames.get(departmentIdentity(record.department)) ??
        record.department,
    }))
    .sort((a, b) => a.financialYear.localeCompare(b.financialYear));
}

export function getDepartment(idOrName: string, year?: string) {
  const history = getDepartmentHistory(idOrName);
  const records = year
    ? history.filter((record) => record.financialYear === year)
    : history;
  return records.at(-1);
}

export function getDepartmentByName(name: string) {
  return getDepartment(name);
}

export function compareDepartments(ids: string[]) {
  return ids.map((id) => ({
    id: slugify(id),
    name: displayNames.get(departmentIdentity(id)) ?? id,
    history: getDepartmentHistory(id),
  }));
}

export function getDataStatus(): DataStatus {
  return {
    errors: loaded.errors,
    invalidRecords: loaded.files.reduce(
      (total, file) => total + file.invalidRecords,
      0,
    ),
    isEmpty: budgetRecords.length === 0,
  };
}

export function getDatasetMetadata() {
  return getFinancialYears();
}

export const financialYears = getFinancialYears().map((entry) => entry.year);
export const budgetEntries = getDepartments();
export const totalBudgetCrore = budgetEntries.reduce(
  (total, entry) => total + entry.amountCrore,
  0,
);
