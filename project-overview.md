# PacStac — Detailed Project Overview (Industry Review)

Last updated: 2025-12-16

> Note: This repository is a **developer demo site** for the consumer-facing Attestation API. Some “implementation touchpoint” paths below refer to the upstream PacStac monorepo and are included for conceptual context.

## 1) Executive summary

PacStac is a “proof-of-stewardship” system that links **public identifiers** (domains, ENS names, and social accounts) to **wallets** using deterministic, auditable verification methods. The system continuously re-checks proofs, maintains an append-only verification history, and can emit **signed attestations** that external consumers can verify via a small read-only API.

Key properties:

- **Deterministic**: proofs are based on DNS/HTTP/ENS primitives (and for social, on publicly visible posts + cryptographic signatures).
- **Auditable**: each binding has a verification lifecycle (pending → verified → failing/revoked) with stored evidence and error traces.
- **Composable**: downstream apps can query or verify attestations independently using public keys (JWKS).
- **Tokenized signal**: verified namespaces contribute to STAC-related tokenomics (issuance/entitlements) in the PacStac stack.

## 2) Repository structure (demo repo)

This repo is a single Next.js (T3-style) app:

- `src/app/` — App Router UI routes (Verify, Attestations, JWKS, Events, Offline Verify)
- `src/app/api/pacstac/*` — server-side proxy routes to `https://pacstac.com/v1/*` (avoids CORS)
- `src/lib/*` — canonical JSON + Ed25519 offline verification helpers

Core docs:

- Verification spec: `docs/verification-spec.md`
- Consumer API: `docs/api-developer.md`
- OpenAPI: `docs/api-openapi.yaml`
- MCP server notes: `docs/mcp.md`

## 3) Product model and concepts

### 3.1 Namespaces (identifiers that can be proven)

PacStac currently supports:

- **Domains** (DNS + HTTP)
- **ENS names** (ENS text records)
- **X (Twitter)** (public post URL containing a deterministic proof statement)

Each namespace proof is a “binding” between:

- an **asset identifier** (e.g., `example.com`, `vitalik.eth`, `@handle`)
- a **wallet** (address/public key)
- a **verification method** (DNS TXT, HTTP `/.well-known`, ENS text, X-post)

### 3.2 Bindings and verification status

Bindings are evaluated repeatedly by verifiers/schedulers.

Common status lifecycle:

- `PENDING`: created, not yet verified (or awaiting new proof/evidence)
- `VERIFIED`: proof validated successfully
- `FAILED`: proof invalid/missing (will retry; may eventually revoke)
- `REVOKED`: historically verified but currently failing beyond policy thresholds (domain/ENS-style bindings)

In addition, bindings track operational metadata like `lastCheckAt`, `nextCheckAt`, `checkCount`, `consecutiveOK`, and `lastError`.

## 4) Proof formats and verification methods

### 4.1 SIWE-style split proof (`pacstac_msg` + `pacstac_verify`)

The core cryptographic proof used across domain/ENS is split into:

- `pacstac_msg`: a base64-encoded message (SIWE-like) describing the claim
- `pacstac_verify`: a signature over that message by the steward wallet

This split is used because DNS providers (and other registries) often constrain record lengths; the message is deterministic and the signature is the proof.

### 4.2 DNS TXT method (domains)

Domains publish two TXT records:

- `pacstac_msg.<domain>` = base64(SIWE message)
- `pacstac_verify.<domain>` = `0x…` EVM signature

Verifiers:

1. resolve DNS TXT records across resolvers
2. re-join segmented TXT chunks when necessary
3. parse `pacstac_msg`, recover expected wallet from signature `pacstac_verify`
4. ensure message content matches the domain and the target wallet

Implementation touchpoints:

- DNS tools: `apps/web/src/server/dns-tools.ts`
- DNS verification method: `apps/web/src/server/verification/dns-txt.ts`
- Domain binding service orchestration: `apps/web/src/server/domain-binding-service.ts`

### 4.3 HTTP `/.well-known` method (domains)

Domains host a JSON file at:

`https://<domain>/.well-known/pacstac_<domain>.json`

Example shape:

```json
{
  "version": "1.0",
  "domain": "example.com",
  "pacstac_msg": "BASE64_SIWE_MESSAGE",
  "pacstac_verify": "0xEVM_SIGNATURE",
  "verified_by": "www.pacstac.com",
  "issued_at": "2025-12-15T17:10:00Z"
}
```

Verifiers:

1. fetch `/.well-known/pacstac_<domain>.json` via HTTP(S)
2. validate schema + version
3. verify signature `pacstac_verify` against decoded `pacstac_msg`
4. ensure message binds the correct domain and wallet

Implementation touchpoints:

- HTTP well-known verification: `apps/web/src/server/verification/well-known.ts`

### 4.4 ENS text record method

ENS names publish two text records:

- `Text(pacstac_msg)` = base64(SIWE message)
- `Text(pacstac_verify)` = `0x…` signature

Verifiers:

1. resolve ENS text records via the configured network/provider
2. verify signature exactly as for domains

Implementation touchpoints:

- ENS verification: `apps/web/src/server/verification/ens.ts`
- ENS integration utilities: `apps/web/src/server/ens/`

### 4.5 X (Twitter) method

X proofs are modeled as:

- a deterministic challenge message (signed by wallet)
- a public post URL that contains evidence tying the handle + nonce + wallet signature together

High-level flow:

1. user creates an X binding by selecting a linked wallet + providing an X handle
2. system generates a challenge message and asks the user to sign it
3. user posts the proof content to X and pastes the post URL into PacStac
4. verifier fetches post content (via X API, or public fetch depending on configuration) and validates:
   - handle matches
   - proof text matches expected challenge content and signature
   - wallet signature validates the challenge
   - premium status influences STAC weighting

Implementation touchpoints:

- X verification helpers: `apps/web/src/server/verification/x.ts`
- X binding service: `apps/web/src/server/x-binding-service.ts`
- tRPC router: `apps/web/src/server/api/routers/x.ts`
- UI: `apps/web/src/app/x/`

## 5) Application architecture (web, API, background jobs)

### 5.1 Frontend: Next.js App Router

The user-facing app lives under `apps/web/src/app/` and is organized by route.

Notable routes:

- `/domains` and `/domains/[domain]` — domain binding UI (DNS + `/.well-known`)
- `/ens` — ENS binding UI
- `/x` — X namespace UI
- `/dashboard` — summary dashboard (bindings + social proofs)
- `/developer/*` — developer hub content
- `/admin/*` — admin console (verification ops, system stats, social admin, cron logs)

### 5.2 Server API: tRPC

Most authenticated reads/writes are via tRPC routers:

- `apps/web/src/server/api/routers/*`

Common patterns:

- `protectedProcedure`: requires an authenticated session
- `adminProcedure`: requires admin role

### 5.3 Consumer API: signed attestation endpoints

PacStac exposes read-only endpoints intended for external consumers:

- `POST https://pacstac.com/v1/verify`
- `GET https://pacstac.com/v1/attestations/{attestationId}`
- `GET https://pacstac.com/v1/.well-known/jwks.json`
- `GET https://pacstac.com/v1/bindings/{bindingId}/events?cursor=...&limit=...`

Doc:

- `docs/api-developer.md`

Implementation touchpoints:

- Consumer model + signing: `apps/web/src/server/consumer/*`
- Route handlers under App Router: `apps/web/src/app/v1/`

### 5.4 Background verification scheduler

Bindings are not “one-and-done”; they are rechecked on schedules.

Core concepts:

- each binding has `nextCheckAt`
- schedulers query “due” items and attempt verification
- results update status, error details, and reschedule future checks

Implementation touchpoints:

- Domain binding orchestration: `apps/web/src/server/domain-binding-service.ts`
- Job infrastructure: `apps/web/src/server/jobs/`
- Cron log: `apps/web/src/server/cron-logger.ts`

## 6) Data model (Firestore)

Firestore is the primary datastore. The DB wrapper centralizes access patterns and serialization:

- `apps/web/src/server/db.ts`

Key collections (conceptual; exact fields evolve):

- `app_users` / `user_profiles` — user identity/profile data
- `wallets` and `user_wallets` — linked wallets per user
- `domains` — domain records
- `domainBindings` — domain binding proofs (DNS/HTTP)
- `bindings` — a general binding/event/verification record layer used by parts of the UI and API
- `xBindings` — X namespace bindings
- `verifications`, `verification_checks`, `verification_audit` — system-wide verification summaries and logs
- `attestations` — signed attestation records
- tokenomics collections (epochs, entitlements, STAC attestations) — under `apps/web/src/server/tokenomics/*`

## 7) Authentication and sessions

PacStac uses an authenticated web app model (Google sign-in, etc.) and enforces session persistence across navigation and reloads.

Implementation touchpoints:

- NextAuth configuration: `apps/web/src/server/auth/`
- Session/debug tooling: `apps/web/src/app/_components/session-logger`

Key goals:

- consistent cookie/session behavior across `www` vs apex domain in production
- prevent “logged out on tab switch” regressions by ensuring host/URL alignment and stable session storage

## 8) Attestations: signing, verification, and trust model

PacStac produces signed attestations that can be verified offline by consumers.

Core properties:

- Attestations are signed with **Ed25519**.
- Public keys are published via JWKS:
  - `GET https://pacstac.com/v1/.well-known/jwks.json`
- Consumers verify the detached signature over a canonical payload serialization.

Signing configuration:

- `PACSTAC_ATTESTATION_SIGNING_SEED` (production required)
- `PACSTAC_ATTESTATION_KID` (optional)

Code:

- `apps/web/src/server/consumer/attestation-signing.ts`

## 9) Tokenomics / STAC integration

PacStac includes STAC-related services that:

- compute wallet entitlements from verified namespaces
- write issuance/claims artifacts (epochs, merkle roots, distribution tables)
- allow admin monitoring and operational controls

Implementation touchpoints:

- `apps/web/src/server/tokenomics/*`
- Admin UI: `apps/web/src/app/admin/stac/*`

Important: STAC is intended as a **signal** (reputation/trust primitive), not a personhood/identity guarantee.

## 10) Admin console and operations

Admin UI provides visibility into:

- verification queues, status breakdowns, error messages
- system metrics, cron/job execution history
- social bindings administration (X)
- tokenomics epoch ops and distribution tooling

Implementation touchpoints:

- Admin pages: `apps/web/src/app/admin/*`
- Admin routers: `apps/web/src/server/api/routers/*` (admin-prefixed routers where applicable)

## 11) Security model (high-level)

### 11.1 Threats addressed

- **Spoofing domain ownership**: mitigated by requiring DNS or HTTP proof + cryptographic signature by wallet.
- **Replay**: messages include nonces/timestamps (method-dependent) and verifiers enforce policy.
- **Tampering**: attestations are signed; downstream consumers verify signatures and freshness.
- **Account misuse**: authenticated operations restrict binding creation/modification to the owning user (and admins).

### 11.2 Trust boundaries

- Public verification inputs: DNS records, well-known files, ENS text records, public social posts.
- Private/authenticated operations: linking wallets, generating challenges, storing signatures, scheduling checks.
- External API dependencies: DNS resolvers, ENS providers, X API (and bearer tokens).

### 11.3 Operational hardening

- keep `NEXTAUTH_URL` aligned with production host (cookie scope + callback stability)
- store signing seeds securely and rotate via `kid` strategy where needed
- rate-limit and backoff failed verifications to avoid self-inflicted load

## 12) How verification becomes “developer-consumable”

Consumers typically do:

1. Call `POST /v1/verify` with wallet + asset + policy.
2. Receive `bestAttestation` with a signature.
3. Fetch JWKS and verify signature offline.
4. Use “pass/fail + metadata” as an input to gating, trust, or reputation logic.

This separation makes PacStac a **source of signed facts**, not a centralized authorization service.

## 13) Extension points and roadmap direction (conceptual)

The system is designed to add additional namespaces and methods that share the same primitives:

- deterministic claim message
- user-signed proof by wallet
- public evidence location (DNS/HTTP/registry/social)
- scheduled re-verification + revocation policy
- standardized, signed attestation emission

New namespaces should plug into:

- DB models in `apps/web/src/server/db.ts`
- verification method implementation in `apps/web/src/server/verification/`
- UI flows under `apps/web/src/app/<namespace>/`
- tokenomics entitlements (if the namespace contributes to STAC)

## 14) Quick “code map” for reviewers

- Verification spec & formats: `docs/verification-spec.md`
- Domain DNS proof logic: `apps/web/src/server/verification/dns-txt.ts`
- Domain well-known proof logic: `apps/web/src/server/verification/well-known.ts`
- ENS proof logic: `apps/web/src/server/verification/ens.ts`
- X proof logic: `apps/web/src/server/verification/x.ts`
- Scheduler/orchestration: `apps/web/src/server/domain-binding-service.ts`, `apps/web/src/server/jobs/`
- Consumer API: `apps/web/src/app/v1/`, `apps/web/src/server/consumer/*`
- Tokenomics / STAC: `apps/web/src/server/tokenomics/*`
- Firestore DB layer: `apps/web/src/server/db.ts`

## 15) Glossary

- **Namespace**: an identifier type (domain, ENS, X handle).
- **Binding**: a record that asserts “this wallet stewards this namespace” via a method.
- **Method**: how the proof is published (DNS TXT, `/.well-known`, ENS text, X post).
- **Verification**: scheduled evaluation of a binding to produce a status and evidence.
- **Attestation**: signed, portable statement derived from verified bindings.
- **JWKS**: public-key set used by consumers to verify attestation signatures.
- **STAC**: tokenomics signal derived from verified namespaces.
