import { proxyPacstac } from "../_lib/proxy";

export async function GET(request: Request) {
  return proxyPacstac({ method: "GET", path: "/.well-known/jwks.json", request });
}

