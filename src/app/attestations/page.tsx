import { AttestationDemo } from "./_components/attestation-demo";

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Fetch an attestation</h1>
        <p className="text-sm text-zinc-300">
          Store an `attestationId` and re-fetch later for offline verification.
        </p>
      </section>
      <AttestationDemo />
    </div>
  );
}

