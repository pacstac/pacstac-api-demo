import { getPacstacBaseUrl } from "~/lib/pacstac-base-url";

type ProxyOptions = {
  method: "GET" | "POST";
  path: string;
  request: Request;
};

export async function proxyPacstac(options: ProxyOptions) {
  const baseUrl = getPacstacBaseUrl();
  const url = new URL(`${baseUrl}/v1${options.path}`);

  if (options.method === "GET") {
    const incoming = new URL(options.request.url);
    incoming.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  }

  const headers = new Headers();
  headers.set("accept", "application/json");

  let body: string | undefined;
  if (options.method === "POST") {
    headers.set("content-type", "application/json");
    body = await options.request.text();
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json(
      {
        error: "PACSTAC_FETCH_FAILED",
        message,
        target: url.toString(),
      },
      { status: 502 },
    );
  }

  const responseBody = await response.text();
  return new Response(responseBody, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}
