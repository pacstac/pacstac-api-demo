"use client";

import { useMemo, useState } from "react";

import { JsonBlock } from "~/app/_components/json-block";
import type { VerifyRequest } from "~/lib/pacstac-types";

function isEvmAddress(input: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(input.trim());
}

function looksLikeDomain(input: string) {
  const v = input.trim();
  if (v.length < 4 || v.length > 253) return false;
  if (v.includes(" ")) return false;
  return v.includes(".");
}

export function VerifyDemo() {
  const [chain, setChain] = useState("eip155:1");
  const [address, setAddress] = useState("");
  const [domain, setDomain] = useState("");
  const [asOf, setAsOf] = useState("2025-12-15T17:10:00Z");
  const [maxAgeSeconds, setMaxAgeSeconds] = useState(172800);
  const [notRevoked, setNotRevoked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const formOk = chain.trim().length > 0 && isEvmAddress(address) && looksLikeDomain(domain);

  const requestBody: VerifyRequest = useMemo(
    () => ({
      wallet: { chain, address: address.trim() },
      asset: { type: "domain", ref: { domain: domain.trim() } },
      asOf,
      require: { maxAgeSeconds, notRevoked },
    }),
    [chain, address, domain, asOf, maxAgeSeconds, notRevoked],
  );

  async function onVerify() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/pacstac/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = (await response.json()) as unknown;
      if (!response.ok) {
        setError(`HTTP ${response.status}`);
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">Request</div>
          <div className="text-xs text-zinc-400">POST `/v1/verify`</div>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-300">Wallet chain</span>
            <input
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="eip155:1"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-300">Wallet address</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="0x…"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-300">Domain</span>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="example.com"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-300">asOf (RFC3339)</span>
            <input
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="2025-12-15T17:10:00Z"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-300">maxAgeSeconds</span>
              <input
                value={maxAgeSeconds}
                type="number"
                onChange={(e) => setMaxAgeSeconds(Number(e.target.value))}
                className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                checked={notRevoked}
                type="checkbox"
                onChange={(e) => setNotRevoked(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
              />
              <span className="text-zinc-300">notRevoked</span>
            </label>
          </div>

          <button
            type="button"
            onClick={onVerify}
            disabled={loading || !formOk}
            className="rounded bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </div>

        <JsonBlock title="Request JSON" value={requestBody} />
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">Response</div>
          <div className="text-xs text-zinc-400">Shows raw JSON from PacStac</div>
        </div>
        {error ? (
          <div className="rounded border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <JsonBlock title="Response JSON" value={result} />
      </div>
    </div>
  );
}
