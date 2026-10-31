/**
 * BudgetWatch — MoSPI Consumer Price Index (CPI) API request types.
 * Based on the CPI parameter documentation supplied by the user.
 */

export type CPIBaseYear = 2010 | 2012 | 2024;
export type CPILevel = "group" | "subgroup" | "item";

/** CPI month codes are conventionally 1–12; confirm against API's code mapping. */
export type CPIMonthCode =
  | "1" | "2" | "3" | "4" | "5" | "6"
  | "7" | "8" | "9" | "10" | "11" | "12";

/**
 * CPI response filters are passed as query strings.
 * Comma-separated values are supported for year/month/code filters where applicable.
 */
export interface CPIRequestParams {
  base_year: CPIBaseYear;
  level?: CPILevel;
  year?: string;
  month_code?: string;
  state_code?: string;
  sector_code?: string;
  division_code?: string;
  group_code?: string;
  class_code?: string;
  sub_class_code?: string;
  item_code?: string;
  limit?: number;
  page?: number;
}

/** The documentation states level is required only for base years 2010 and 2012. */
export type CPIRequestParams2010Or2012 =
  Omit<CPIRequestParams, "base_year" | "level"> & {
    base_year: 2010 | 2012;
    level: CPILevel;
  };

export type CPIRequestParams2024 =
  Omit<CPIRequestParams, "base_year" | "level"> & {
    base_year: 2024;
    /** 2024 uses division → group → class → sub-class → item hierarchy. */
    level?: never;
  };
