export function decodeHexToBytes(input: string) {
  const cleaned = input.trim().toLowerCase().replace(/^0x/, "");
  if (cleaned.length % 2 !== 0) throw new Error("Invalid hex length");
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

