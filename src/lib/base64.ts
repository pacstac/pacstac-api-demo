function normalizeBase64(input: string) {
  return input.replace(/-/g, "+").replace(/_/g, "/");
}

function padBase64(input: string) {
  const pad = input.length % 4;
  if (pad === 0) return input;
  return input + "=".repeat(4 - pad);
}

export function decodeBase64ToBytes(input: string) {
  const cleaned = input.trim();
  const normalized = padBase64(normalizeBase64(cleaned));

  if (typeof atob === "function") {
    const bin = atob(normalized);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  return Uint8Array.from(Buffer.from(normalized, "base64"));
}

