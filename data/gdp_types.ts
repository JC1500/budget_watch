/**
 * BudgetWatch — MoSPI National Accounts Statistics (NAS) API
 * Request parameter types based on the API parameter documentation supplied by the user.
 *
 * Note: code lists describe allowed ranges where supplied; their meanings require
 * the official code master/metadata. Numeric-coded fields are represented as strings
 * where the API documentation says comma-separated values are accepted.
 */

export type GDPBaseYear = "2011-12" | "2022-23";
export type GDPSeries = "Current" | "Back";
export type GDPFrequencyCode = "Annually" | "Quarterly";
export type GDPFormat = "JSON" | "CSV";
export type GDPQuarterlyCode = "1" | "2" | "3" | "4";
export type GDPApproachCode = "01" | "02" | "03";
export type GDPRevisionCode = "01" | "02" | "03" | "04" | "05" | "06" | "07";
export type GDPAccountCode = "01" | "02";

/** Allowed numeric ranges from the supplied documentation; meanings are not included. */
export type GDPInstitutionalCode =
  | "01" | "02" | "03" | "04" | "05" | "06"
  | "07" | "08" | "09" | "10" | "11";

export type GDPIndustryCode =
  | "01" | "02" | "03" | "04" | "05" | "06"
  | "07" | "08" | "09" | "10" | "11" | "12"
  | "13" | "14" | "15" | "16" | "17";

export type GDPSubindustryCode =
  | "01" | "02" | "03" | "04" | "05" | "06"
  | "07" | "08" | "09" | "10" | "11" | "12"
  | "13" | "14" | "15" | "16" | "17" | "18";

/** Financial year format documented as YYYY-YY, e.g. 2024-25. */
export type GDPFinancialYear = `${number}-${string}`;

/**
 * Required parameters:
 * - base_year, series, frequency_code, indicator_code, Format
 *
 * Optional filters are included as documented. For comma-separated parameters,
 * pass a comma-separated string (e.g. "2022-23,2023-24").
 */
export interface GDPRequestParams {
  base_year: GDPBaseYear;
  series: GDPSeries;
  frequency_code: GDPFrequencyCode;
  indicator_code: string;
  Format: GDPFormat;

  quarterly_code?: string;
  year?: string;
  approach_code?: string;
  revision_code?: string;
  account_code?: string;
  institutional_code?: string;
  industry_code?: string;
  subindustry_code?: string;
  page?: string;
}

/** GDP indicator code 5 is based on the endpoint URL supplied by the user. */
export const GDP_INDICATOR_CODES = {
  grossDomesticProduct: "5",
} as const;

/** Constraints stated in the supplied API documentation. */
export interface GDPParameterRules {
  base_year: {
    allowed: GDPBaseYear[];
    seriesByBaseYear: {
      "2011-12": GDPSeries[];
      "2022-23": ["Current"];
    };
  };
  frequency_code: GDPFrequencyCode[];
  quarterly_code: GDPQuarterlyCode[];
  approach_code: GDPApproachCode[];
  revision_code: GDPRevisionCode[];
  account_code: GDPAccountCode[];
  institutional_code: GDPInstitutionalCode[];
  industry_code: GDPIndustryCode[];
  subindustry_code: GDPSubindustryCode[];
  Format: GDPFormat[];
}
