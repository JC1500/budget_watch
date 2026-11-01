import type {
  GDPApiParams,
  GDPApiResponse,
  GDPRecord,
} from "@/lib/types/gdp";

const GDP_API_URL = "/api/gdp";

const requestCache = new Map<string, Promise<GDPRecord[]>>();

async function fetchGDPPage(
  query: URLSearchParams,
): Promise<{ records: GDPRecord[]; totalPages: number }> {
  const response = await fetch(`${GDP_API_URL}?${query}`);

  if (!response.ok) {
    throw new Error(
      `MoSPI GDP API request failed: ${response.status}`,
    );
  }

  const result: unknown = await response.json();

  if (
    typeof result !== "object" ||
    result === null ||
    !Array.isArray((result as GDPApiResponse).data)
  ) {
    throw new Error("Invalid response received from MoSPI GDP API");
  }

  const metadata = (result as GDPApiResponse).meta_data;
  const totalPages = Number(metadata?.totalPages ?? 1);

  return {
    records: (result as GDPApiResponse).data,
    totalPages:
      Number.isInteger(totalPages) && totalPages > 0
        ? totalPages
        : 1,
  };
}

export async function getGDPData(
  params: GDPApiParams = {},
): Promise<GDPRecord[]> {
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

  const request = (async () => {
    const firstPage = await fetchGDPPage(query);
    const requestedPage = params.page !== undefined;

    if (requestedPage || firstPage.totalPages <= 1) {
      return firstPage.records;
    }

    const pages = await Promise.all(
      Array.from(
        { length: firstPage.totalPages - 1 },
        (_, index) => {
          const pageQuery = new URLSearchParams(query);
          pageQuery.set("page", String(index + 2));
          return fetchGDPPage(pageQuery);
        },
      ),
    );

    return [
      ...firstPage.records,
      ...pages.flatMap((page) => page.records),
    ];
  })()
    .finally(() => {
      requestCache.delete(requestKey);
    });

  requestCache.set(requestKey, request);

  return request;
}