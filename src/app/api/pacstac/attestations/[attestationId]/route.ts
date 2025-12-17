import { proxyPacstac } from "../../_lib/proxy";

type RouteContext<TParams extends Record<string, string>> = { params: TParams | Promise<TParams> };

export async function GET(request: Request, ctx: RouteContext<{ attestationId: string }>) {
  const { attestationId } = await ctx.params;
  return proxyPacstac({
    method: "GET",
    path: `/attestations/${encodeURIComponent(attestationId)}`,
    request,
  });
}
