import { proxyMospiRequest } from "@/lib/server/mospi-proxy";

const INFLATION_API_URL =
  "https://api.mospi.gov.in/api/cpi/getCPIData";

export async function GET(request: Request) {
  return proxyMospiRequest(request, INFLATION_API_URL);
}
