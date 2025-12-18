export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return new Response(
    JSON.stringify({
      ok: true,
      url: request.url,
      node: (globalThis as any)?.process?.versions?.node ?? null,
      pacstacBaseUrl: (globalThis as any)?.process?.env?.PACSTAC_BASE_URL ?? "https://pacstac.com",
      envHasPacstacBaseUrl: typeof (globalThis as any)?.process?.env?.PACSTAC_BASE_URL === "string",
      sslCertFile: (globalThis as any)?.process?.env?.SSL_CERT_FILE ?? null,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}
