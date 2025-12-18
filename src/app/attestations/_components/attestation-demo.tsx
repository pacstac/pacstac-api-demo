"use client";

import { useState } from "react";

import { JsonBlock } from "~/app/_components/json-block";

export function AttestationDemo() {
  const [attestationId, setAttestationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFetch() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`/api/pacstac/attestations/${encodeURIComponent(attestationId)}`);
      const text = await response.text();
      let data: unknown = text;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      if (!response.ok) setError(`HTTP ${response.status}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-300">attestationId</span>
          <input
            value={attestationId}
            onChange={(e) => setAttestationId(e.target.value)}
            className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
            placeholder="..."
          />
        </label>
        <button
          type="button"
          onClick={onFetch}
          disabled={loading || !attestationId.trim()}
          className="rounded bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60"
        >
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </div>
      {error ? (
        <div className="rounded border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      <JsonBlock title="Response JSON" value={result} />
    </div>
  );
}
