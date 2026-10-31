/**
 * BudgetWatch — MoSPI CPI API response types.
 * Based on the CPI JSON response example supplied by the user.
 */

export interface CPIRecord {
  base_year: string;
  series: string;
  year: string;
  month: string;
  state: string;
  sector: string;
  division: string;

  group: string | null;
  class: string | null;
  sub_class: string | null;
  item: string | null;
  code: string | null;

  /** Numeric values are returned as strings in the supplied JSON sample. */
  index: string;
  inflation: string;
  imputation: string | null;
}

export interface CPIMetadata {
  page: number;
  totalRecords: number;
  totalPages: number;
  recordPerPage: number;
}

export interface CPIAPIResponse {
  data: CPIRecord[];
  meta_data: CPIMetadata;
  msg: string;
  statusCode: boolean;
}

/** Optional normalized form for application/database use after parsing numeric strings. */
export interface NormalizedCPIRecord
  extends Omit<CPIRecord, "index" | "inflation"> {
  index: number;
  inflation: number;
}
