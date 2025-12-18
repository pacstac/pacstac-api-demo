function stripTrailingSlashes(url: string) {
  return url.replace(/\/+$/g, "");
}

export function getPacstacBaseUrl() {
  const env =
    typeof process !== "undefined" && process.env ? (process.env as Record<string, string | undefined>) : {};
  const raw = stripTrailingSlashes(env.PACSTAC_BASE_URL ?? "https://pacstac.com");
  if (raw.endsWith("/v1")) return raw.slice(0, -3);
  return raw;
}
