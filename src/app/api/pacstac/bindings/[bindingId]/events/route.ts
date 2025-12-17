import { proxyPacstac } from "../../../_lib/proxy";

type RouteContext<TParams extends Record<string, string>> = { params: TParams | Promise<TParams> };

export async function GET(request: Request, ctx: RouteContext<{ bindingId: string }>) {
  const { bindingId } = await ctx.params;
  return proxyPacstac({
    method: "GET",
    path: `/bindings/${encodeURIComponent(bindingId)}/events`,
    request,
  });
}
