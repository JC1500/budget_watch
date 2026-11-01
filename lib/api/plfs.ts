import type {
  PLFSApiParams,
  PLFSApiResponse,
  PLFSRecord,
} from "@/lib/types/plfs";

const PLFS_API_URL = "/api/plfs";

const requestCache = new Map<string, Promise<PLFSRecord[]>>();

async function fetchPage(
  query: URLSearchParams,
): Promise<{ records: PLFSRecord[]; totalPages: number }> {
  const response = await fetch(`${PLFS_API_URL}?${query}`);

  if (!response.ok) {
    throw new Error(
      `MoSPI PLFS API request failed: ${response.status}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (
    !contentType.toLowerCase().includes("application/json") ||
    body.trimStart().startsWith("<")
  ) {
    throw new Error(
      "MoSPI PLFS API returned HTML instead of JSON. " +
        "The PLFS endpoint may require API registration or authorization.",
    );
  }

  let result: unknown;
  try {
    result = JSON.parse(body);
  } catch {
    throw new Error("MoSPI PLFS API returned malformed JSON.");
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !Array.isArray((result as PLFSApiResponse).data)
  ) {
    throw new Error("Invalid response received from MoSPI PLFS API");
  }

  const metadata = (result as PLFSApiResponse).meta_data;
  const totalPages = Number(metadata?.totalPages ?? 1);

  return {
    records: (result as PLFSApiResponse).data,
    totalPages:
      Number.isInteger(totalPages) && totalPages > 0
        ? totalPages
        : 1,
  };
}

export async function getPLFSData(
  params: PLFSApiParams,
): Promise<PLFSRecord[]> {
  const query = new URLSearchParams();
  query.set("limit", String(params.limit ?? 100));
  query.set("page", String(params.page ?? 1));

  Object.entries(params)
    .sort(([first], [second]) => first.localeCompare(second))
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key === "format" ? "Format" : key, String(value));
      }
    });

  const requestKey = query.toString();
  const cachedRequest = requestCache.get(requestKey);
  if (cachedRequest) return cachedRequest;

  const request = (async () => {
    const page = await fetchPage(query);
    return page.records;
  })().finally(() => {
    requestCache.delete(requestKey);
  });

  requestCache.set(requestKey, request);
  return request;
}
