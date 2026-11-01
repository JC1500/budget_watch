export type PLFSApiParams = {
  indicator_code: number;
  format: string;
  frequency_code?: number | string;
  year?: string;
  month_code?: string;
  quarter_code?: string;
  state_code?: number | string;
  gender_code?: number | string;
  age_code?: number | string;
  sector_code?: number | string;
  religion_code?: number | string;
  social_category_code?: number | string;
  education_code?: number | string;
  weekly_status_code?: number | string;
  year_type_code?: number | string;
  limit?: number;
  page?: number;
};

export type PLFSRecord = {
  year?: string | null;
  state?: string | null;
  gender?: string | null;
  sector?: string | null;
  age_group?: string | null;
  AgeGroup?: string | null;
  indicator?: string | null;
  value?: string | number | null;
  rate?: string | number | null;
  [key: string]: unknown;
};

export type PLFSApiResponse = {
  data: PLFSRecord[];
  meta_data?: {
    totalPages?: string | number;
    totalRecords?: string | number;
  };
};

export const PLFS_YEARS = [
  "2017-18",
  "2018-19",
  "2019-20",
  "2020-21",
  "2021-22",
  "2022-23",
  "2023-24",
] as const;

export const PLFS_INDICATORS = {
  lfpr: 1,
  wpr: 2,
  unemployment: 3,
} as const;

export const PLFS_DEFAULT_FILTERS = {
  frequency_code: "1",
} as const;
