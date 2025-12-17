"use client";

import { useMemo, useState } from "react";

import { JsonBlock } from "~/app/_components/json-block";
import { offlineVerifyAttestation } from "~/lib/attestation-verify";

function parseJson(input: string): unknown {
  return JSON.parse(input);
}

export function OfflineVerifyDemo() {
  const [attestationText, setAttestationText] = useState("");
  const [jwksText, setJwksText] = useState("");
  const [status, setStatus] = useState<
    null | { ok: true; message: string } | { ok: false; message: string }
  >(null);

  const parsedAttestation = useMemo(() => {
    try {
      if (!attestationText.trim()) return null;
      return parseJson(attestationText);
    } catch {
      return null;
    }
  }, [attestationText]);

  const parsedJwks = useMemo(() => {
    try {
      if (!jwksText.trim()) return null;
      return parseJson(jwksText);
    } catch {
      return null;
    }
  }, [jwksText]);

  async function onFetchJwks() {
    const response = await fetch("/api/pacstac/jwks");
    const text = await response.text();
    setJwksText(text);
  }

  function onVerify() {
    try {
      const att = parseJson(attestationText);
      const jwks = parseJson(jwksText);
      const res = offlineVerifyAttestation({ attestation: att, jwks });
      if (res.ok) setStatus({ ok: true, message: `Valid (kid=${res.kid}, mode=${res.mode})` });
      else setStatus({ ok: false, message: res.error });
    } catch (e) {
      setStatus({ ok: false, message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-sm font-medium">Attestation JSON</div>
          <textarea
            value={attestationText}
            onChange={(e) => setAttestationText(e.target.value)}
            className="min-h-[240px] w-full rounded border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-100"
            placeholder='Paste the full attestation object (should include {"signature":{"kid":"...","sig":"..."}})'
          />
          <JsonBlock title="Parsed attestation (if valid JSON)" value={parsedAttestation} />
        </div>

        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">JWKS JSON</div>
            <button
              type="button"
              onClick={onFetchJwks}
              className="rounded border border-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
            >
              Fetch from PacStac
            </button>
          </div>
          <textarea
            value={jwksText}
            onChange={(e) => setJwksText(e.target.value)}
            className="min-h-[240px] w-full rounded border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-100"
            placeholder='Paste JWKS (should include {"keys":[...]}).'
          />
          <JsonBlock title="Parsed JWKS (if valid JSON)" value={parsedJwks} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onVerify}
          disabled={!attestationText.trim() || !jwksText.trim()}
          className="rounded bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60"
        >
          Verify signature
        </button>
        {status ? (
          <div
            className={
              status.ok
                ? "rounded border border-emerald-900 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200"
                : "rounded border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-200"
            }
          >
            {status.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}

