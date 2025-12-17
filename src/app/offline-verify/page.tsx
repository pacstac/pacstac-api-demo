import { OfflineVerifyDemo } from "./_components/offline-verify-demo";

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Offline verify</h1>
        <p className="text-sm text-zinc-300">
          Paste an attestation and verify `signature.sig` using the Ed25519 public key referenced by
          `signature.kid`.
        </p>
      </section>
      <OfflineVerifyDemo />
    </div>
  );
}

