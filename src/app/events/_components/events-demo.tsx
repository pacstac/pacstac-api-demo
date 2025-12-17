"use client";

import { useMemo, useState } from "react";

import { JsonBlock } from "~/app/_components/json-block";

export function EventsDemo() {
  const [bindingId, setBindingId] = useState("");
  const [cursor, setCursor] = useState("");
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (cursor.trim()) params.set("cursor", cursor.trim());
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return `/api/pacstac/bindings/${encodeURIComponent(bindingId)}/events${qs ? `?${qs}` : ""}`;
  }, [bindingId, cursor, limit]);

  async function onFetch() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(url);
      const data = (await response.json()) as unknown;
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
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-zinc-300">bindingId</span>
          <input
            value={bindingId}
            onChange={(e) => setBindingId(e.target.value)}
            className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
            placeholder="..."
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-zinc-300">cursor</span>
          <input
            value={cursor}
            onChange={(e) => setCursor(e.target.value)}
            className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
            placeholder="(optional)"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-zinc-300">limit</span>
          <input
            value={limit}
            type="number"
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={onFetch}
          disabled={loading || !bindingId.trim()}
          className="rounded bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60 md:col-span-2"
        >
          {loading ? "Fetching…" : "Fetch events"}
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

