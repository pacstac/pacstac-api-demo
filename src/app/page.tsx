import { VerifyDemo } from "./verify/_components/verify-demo";

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Verify stewardship</h1>
        <p className="text-sm text-zinc-300">
          Ask: “Is wallet X stewarding asset Y as-of T?” The demo calls PacStac&apos;s consumer API and
          shows the returned attestation + policy checks.
        </p>
      </section>
      <VerifyDemo />
    </div>
  );
}

