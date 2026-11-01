import { proxyMospiRequest } from "@/lib/server/mospi-proxy";

const GDP_API_URL =
  "https://api.mospi.gov.in/api/nas/getNASData";

export async function GET(request: Request) {
  return proxyMospiRequest(request, GDP_API_URL);
}
