export type GDPRecord = {
  base_year: string;
  series: string;
  year: string;
  indicator: string;
  frequency: string;
  state?: string | null;
  quarter?: string | null;
  current_price?: string | number | null;
  constant_price?: string | number | null;
  unit: string;
  revision?: string | null;
};

export type GDPApiParams = {
  base_year?: string;
  series?: string;
  frequency_code?: string;
  indicator_code?: string;
  quarterly_code?: string;
  year?: string;
  approach_code?: string;
  revision_code?: string;
  account_code?: string;
  institutional_code?: string;
  industry_code?: string;
  subindustry_code?: string;

  page?: number | string;
  limit?: number | string;
  format?: "JSON" | "CSV";
};

export type GDPApiResponse = {
  data: GDPRecord[];
  meta_data?: {
    page?: number | string;
    totalRecords?: number | string;
    totalPages?: number | string;
    recordPerPage?: number | string;
  };
  statusCode?: boolean | number;
  msg?: string;
};