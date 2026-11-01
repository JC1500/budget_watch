import type {
  InflationApiParams,
  InflationApiResponse,
  InflationRecord,
} from "@/lib/types/inflation";

const INFLATION_API_URL = "/api/inflation";

const requestCache = new Map<
  string,
  Promise<InflationRecord[]>
>();

export async function getInflationData(
  params: InflationApiParams = {},
): Promise<InflationRecord[]> {
  const query = new URLSearchParams();

  Object.entries(params)
    .sort(([first], [second]) => first.localeCompare(second))
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });

  const requestKey = query.toString();
  const cachedRequest = requestCache.get(requestKey);
  if (cachedRequest) {
    return cachedRequest;
  }

  const request = fetch(`${INFLATION_API_URL}?${requestKey}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `MoSPI API request failed: ${response.status}`,
        );
      }

      const result: unknown = await response.json();

      if (
        typeof result !== "object" ||
        result === null ||
        !Array.isArray((result as InflationApiResponse).data)
      ) {
        throw new Error(
          "Invalid response received from MoSPI API",
        );
      }

      return (result as InflationApiResponse).data;
    })
    .finally(() => {
      requestCache.delete(requestKey);
    });

  requestCache.set(requestKey, request);
  return request;
}