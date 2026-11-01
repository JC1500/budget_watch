import { proxyMospiRequest } from "@/lib/server/mospi-proxy";

const PLFS_API_URL =
  "https://api.mospi.gov.in/api/plfs/getData";

export async function GET(request: Request) {
  return proxyMospiRequest(request, PLFS_API_URL);
}
