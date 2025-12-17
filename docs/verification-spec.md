# Verification spec (high-level)

PacStac is a proof-of-stewardship system that links public identifiers (domains, ENS names, and social accounts) to wallets using deterministic verification methods, with continuous re-checking and an append-only audit history.

This demo repo focuses on the consumer-facing attestation verification flow:

1. Resolve and check policy via `POST /v1/verify`
2. Store and re-fetch attestations via `GET /v1/attestations/{attestationId}`
3. Verify signatures offline using `GET /v1/.well-known/jwks.json`

For the full upstream product overview (proof formats, methods, lifecycles), see `project-overview.md`.

