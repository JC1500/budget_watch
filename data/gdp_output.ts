/**
 * BudgetWatch — MoSPI NAS API response types.
 * Based on the GDP JSON response example supplied by the user.
 */

export interface GDPRecord {
  base_year: string;
  series: string;
  year: string;
  indicator: string;
  /** API example shows "Annual"; quarterly response should be checked live. */
  frequency: string;
  revision: string;
  /** null in annual sample; expected to carry a quarter value for quarterly data. */
  quarter: string | null;
  /** Numeric values are returned as strings in the supplied JSON sample. */
  current_price: string;
  constant_price: string;
  unit: string;
}

export interface GDPMetadata {
  page: number;
  totalRecords: number;
  totalPages: number;
  recordPerPage: number;
}

export interface GDPAPIResponse {
  data: GDPRecord[];
  meta_data: GDPMetadata;
  msg: string;
  statusCode: boolean;
}

/** Optional normalized form for database/application use after parsing numeric strings. */
export interface NormalizedGDPRecord
  extends Omit<GDPRecord, "current_price" | "constant_price"> {
  current_price: number;
  constant_price: number;
}
