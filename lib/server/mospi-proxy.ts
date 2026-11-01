import { SSL_OP_LEGACY_SERVER_CONNECT } from "node:constants";
import https from "node:https";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

const legacyTlsAgent = new https.Agent({
  secureOptions: SSL_OP_LEGACY_SERVER_CONNECT,
});

function fetchUpstream(url: URL): Promise<{
  body: string;
  status: number;
}> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        agent: legacyTlsAgent,
        headers: { accept: "application/json" },
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            body,
            status: response.statusCode ?? 502,
          });
        });
        response.on("error", reject);
      },
    );

    request.setTimeout(30_000, () => {
      request.destroy(new Error("MoSPI API request timed out."));
    });
    request.on("error", reject);
  });
}

export async function proxyMospiRequest(
  request: Request,
  endpoint: string,
) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(endpoint);
  upstreamUrl.search = requestUrl.search;

  const response = await fetchUpstream(upstreamUrl);

  return new Response(response.body, {
    status: response.status,
    headers: JSON_HEADERS,
  });
}
