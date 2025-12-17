# PacStac Attestation API (Consumer)

Base URL: `https://pacstac.com`  
All endpoints are under the `/v1` prefix.

This repo includes a demo UI that proxies these endpoints via `src/app/api/pacstac/*`.

## Verify (resolve + policy checks)

Ask: “Is wallet X stewarding asset Y as-of T?” PacStac returns the best attestation plus policy checks like max age and revocation.

`POST /v1/verify`

Example:

```json
{
  "wallet": { "chain": "eip155:1", "address": "0xABC..." },
  "asset": { "type": "domain", "ref": { "domain": "example.com" } },
  "asOf": "2025-12-15T17:10:00Z",
  "require": { "maxAgeSeconds": 172800, "notRevoked": true }
}
```

The response includes `bestAttestation` and `checks` (shape may evolve).

## Fetch by `attestationId`

Fetch an attestation so you can store it and re-verify it offline later.

`GET /v1/attestations/{attestationId}`

## JWKS (public keys)

Consumers verify attestation signatures using the Ed25519 public key identified by `signature.kid`.

`GET /v1/.well-known/jwks.json`

High-level verification:

1. Fetch JWKS and select the key whose `kid` matches the attestation `signature.kid`.
2. Verify `signature.sig` over the canonical JSON payload using that Ed25519 public key.

This demo app includes an “Offline Verify” screen that performs this verification in the browser.

## Audit events

Fetch a compact append-only view of verification events for a binding.

`GET /v1/bindings/{bindingId}/events?cursor=...&limit=...`

