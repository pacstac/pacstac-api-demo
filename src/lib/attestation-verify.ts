import nacl from "tweetnacl";

import { decodeBase64ToBytes } from "./base64";
import { canonicalizeJson } from "./canonical-json";
import { decodeHexToBytes } from "./hex";

type JwkOkpEd25519 = { kty: "OKP"; crv: "Ed25519"; x: string; kid?: string };

function utf8Bytes(input: string) {
  return new TextEncoder().encode(input);
}

function decodeSignature(sig: string) {
  const trimmed = sig.trim();
  if (trimmed.startsWith("0x")) return decodeHexToBytes(trimmed);
  return decodeBase64ToBytes(trimmed);
}

function parseJwksKey(jwk: unknown, kid: string) {
  if (!jwk || typeof jwk !== "object") return null;
  const k = jwk as Partial<JwkOkpEd25519>;
  if (k.kty !== "OKP" || k.crv !== "Ed25519") return null;
  if (k.kid !== kid) return null;
  if (!k.x) return null;
  return k as JwkOkpEd25519;
}

export type OfflineVerifyResult =
  | { ok: true; kid: string; mode: "payload" | "attestationWithoutSignature" }
  | { ok: false; error: string };

export function offlineVerifyAttestation(input: {
  attestation: unknown;
  jwks: unknown;
}): OfflineVerifyResult {
  try {
    if (!input.attestation || typeof input.attestation !== "object") {
      return { ok: false, error: "Attestation must be a JSON object" };
    }
    const att = input.attestation as Record<string, unknown>;
    const signature = att.signature as Record<string, unknown> | undefined;
    const kid = signature?.kid;
    const sig = signature?.sig;
    if (typeof kid !== "string" || typeof sig !== "string") {
      return { ok: false, error: "Expected attestation.signature.kid and attestation.signature.sig" };
    }

    const keys = (input.jwks as any)?.keys;
    if (!Array.isArray(keys)) return { ok: false, error: "JWKS must include keys[]" };
    const jwk = keys.find((k) => parseJwksKey(k, kid));
    if (!jwk) return { ok: false, error: `No Ed25519 JWKS key found for kid=${kid}` };

    const publicKey = decodeBase64ToBytes((jwk as JwkOkpEd25519).x);
    const signatureBytes = decodeSignature(sig);

    const payload = att.payload;
    if (payload && typeof payload === "object") {
      const msg = utf8Bytes(canonicalizeJson(payload));
      if (nacl.sign.detached.verify(msg, signatureBytes, publicKey)) {
        return { ok: true, kid, mode: "payload" };
      }
    }

    const { signature: _sig, ...withoutSignature } = att;
    const msg = utf8Bytes(canonicalizeJson(withoutSignature));
    if (nacl.sign.detached.verify(msg, signatureBytes, publicKey)) {
      return { ok: true, kid, mode: "attestationWithoutSignature" };
    }

    return { ok: false, error: "Signature did not verify (tried payload and attestation-without-signature)" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

