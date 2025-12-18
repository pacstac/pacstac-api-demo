"use client";

import { useState } from "react";

import { JsonBlock } from "~/app/_components/json-block";

export function JwksDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFetch() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/pacstac/jwks");
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
      <button
        type="button"
        onClick={onFetch}
        disabled={loading}
        className="rounded bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60"
      >
        {loading ? "Fetching…" : "Fetch JWKS"}
      </button>
      {error ? (
        <div className="rounded border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      <JsonBlock title="JWKS JSON" value={result} />
    </div>
  );
}
