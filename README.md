# PacStac API Demo (Next.js)

Developer-facing demo site for the PacStac Attestation API (`/v1/verify`, `/v1/attestations/:id`, JWKS, binding events).

## Quickstart

1. Install deps: `npm install`
2. (Optional) copy env: `cp .env.example .env`
3. Run: `npm run dev` (defaults to port 4040; override with `PORT=4041 npm run dev`)

## Notes

- The UI calls PacStac via server-side proxy routes under `src/app/api/pacstac/*` to avoid CORS issues.
- Docs live under `docs/` (start with `docs/api-developer.md`).
