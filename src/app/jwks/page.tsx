import { JwksDemo } from "./_components/jwks-demo";

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">JWKS</h1>
        <p className="text-sm text-zinc-300">
          Fetch PacStac public keys (`/v1/.well-known/jwks.json`) used to verify attestation
          signatures.
        </p>
      </section>
      <JwksDemo />
    </div>
  );
}

