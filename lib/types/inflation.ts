export type InflationRecord = {
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

  index: string | number | null;
  inflation: string | number | null;

  imputation: string | null;
};

export type InflationMetric = "inflation";

export type InflationApiParams = {
  base_year?: string;
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
};

export type InflationApiResponse = {
  data: InflationRecord[];
};

export const CPI_BASE_YEAR = "2024";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const STATES = [] as const;

export const SECTOR = [
  "Urban",
  "Rurals",
];

export const VARIANTS = [
  "All-India",
  "State-Wise",
  "Sector-Wise",
  "Product-Wise",
];