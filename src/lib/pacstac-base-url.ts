function stripTrailingSlashes(url: string) {
  return url.replace(/\/+$/g, "");
}

export function getPacstacBaseUrl() {
  const raw = stripTrailingSlashes(process.env.PACSTAC_BASE_URL ?? "https://pacstac.com");
  if (raw.endsWith("/v1")) return raw.slice(0, -3);
  return raw;
}

