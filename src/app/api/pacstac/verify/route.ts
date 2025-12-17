import { proxyPacstac } from "../_lib/proxy";

export function GET() {
  return Response.json(
    { error: "METHOD_NOT_ALLOWED", allowed: ["POST"] },
    { status: 405, headers: { allow: "POST" } },
  );
}

export async function POST(request: Request) {
  return proxyPacstac({ method: "POST", path: "/verify", request });
}
