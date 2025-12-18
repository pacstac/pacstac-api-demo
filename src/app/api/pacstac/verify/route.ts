export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED", allowed: ["POST"] }), {
    status: 405,
    headers: { "content-type": "application/json", allow: "POST" },
  });
}

export async function POST(request: Request) {
  try {
    const envBase = (globalThis as any)?.process?.env?.PACSTAC_BASE_URL as string | undefined;
    const raw = (envBase ?? "https://pacstac.com").trim().replace(/\/+$/g, "");
    const withScheme = raw.match(/^https?:\/\//i) ? raw : `https://${raw}`;
    const base = withScheme.endsWith("/v1") ? withScheme.slice(0, -3) : withScheme;
    const url = new URL(`${base}/v1/verify`);

    const body = await request.text();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": request.headers.get("user-agent") ?? "pacstac-api-demo",
      },
      body,
      cache: "no-store",
    });
    const responseBody = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    if (response.status >= 500 || !contentType.toLowerCase().includes("application/json")) {
      return new Response(
        JSON.stringify({
          error: "PACSTAC_UPSTREAM_ERROR",
          target: url.toString(),
          upstreamStatus: response.status,
          upstreamContentType: contentType,
          raw: responseBody,
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(responseBody, { status: response.status, headers: { "content-type": contentType } });
  } catch (e) {
    const err = e as any;
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pacstac-proxy] verify fetch failed", message);
    return new Response(
      JSON.stringify({
        error: "PACSTAC_FETCH_FAILED",
        message,
        target: "https://pacstac.com/v1/verify",
        details: {
          name: typeof err?.name === "string" ? err.name : undefined,
          code: typeof err?.code === "string" ? err.code : undefined,
        },
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}
