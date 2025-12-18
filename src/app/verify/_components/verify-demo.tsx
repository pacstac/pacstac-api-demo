"use client";

import { useEffect, useMemo, useState } from "react";

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

function toIsoNow() {
  return new Date().toISOString();
}

function toIsoDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function parseIsoMs(input: unknown) {
  if (typeof input !== "string") return null;
  const ms = Date.parse(input);
  return Number.isFinite(ms) ? ms : null;
}

function secondsBetween(aMs: number, bMs: number) {
  return Math.floor((aMs - bMs) / 1000);
}

function pickVerifySummary(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as any;
  const best = v.bestAttestation;
  const checks = v.checks;
  return {
    ok: v.ok,
    status: v.status,
    reason: v.reason,
    issuedAt: best?.issuedAt,
    validFrom: best?.validFrom,
    validUntil: best?.validUntil,
    bindingId: best?.bindingId,
    attestationId: best?.attestationId,
    attestationResult: best?.result,
    methodKind: best?.method?.kind,
    signatureKid: best?.signature?.kid,
    ageSeconds: checks?.ageSeconds,
    withinMaxAge: checks?.withinMaxAge,
    revoked: checks?.revoked,
  };
}

function OutcomeGraphic(props: Readonly<{ variant: "success" | "fail" | "error" | "idle" }>) {
  const palette =
    props.variant === "success"
      ? { ring: "border-emerald-800 bg-emerald-950/40 text-emerald-200", stroke: "#34d399" }
      : props.variant === "fail"
        ? { ring: "border-rose-900 bg-rose-950/40 text-rose-200", stroke: "#fb7185" }
        : props.variant === "error"
          ? { ring: "border-amber-900 bg-amber-950/40 text-amber-200", stroke: "#fbbf24" }
          : { ring: "border-zinc-800 bg-zinc-950/40 text-zinc-200", stroke: "#a1a1aa" };

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-full border ${palette.ring}`}
      aria-hidden="true"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        {props.variant === "success" ? (
          <path
            d="M20 6L9 17l-5-5"
            stroke={palette.stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : props.variant === "fail" ? (
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke={palette.stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : props.variant === "error" ? (
          <path
            d="M12 7v6m0 4h.01"
            stroke={palette.stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M12 6v6l4 2"
            stroke={palette.stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}

export function VerifyDemo() {
  const [chain, setChain] = useState("eip155:1");
  const [address, setAddress] = useState("0xD95e7e48bb4497C5E3bb05fF41e3D10149661873");
  const [domain, setDomain] = useState("blockrush.com");
  const [includeAsOf, setIncludeAsOf] = useState(true);
  const [asOf, setAsOf] = useState("");
  const [maxAgeSeconds, setMaxAgeSeconds] = useState(172800);
  const [notRevoked, setNotRevoked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAsOf(toIsoDaysAgo(30));
  }, []);

  const formOk = chain.trim().length > 0 && isEvmAddress(address) && looksLikeDomain(domain);

  const requestBody: VerifyRequest = useMemo(
    () => {
      const body: VerifyRequest = {
        wallet: { chain, address: address.trim().toLowerCase() },
        asset: { type: "domain", ref: { domain: domain.trim() } },
        require: { maxAgeSeconds, notRevoked },
      };
      if (includeAsOf && asOf.trim()) body.asOf = asOf.trim();
      return body;
    },
    [chain, address, domain, includeAsOf, asOf, maxAgeSeconds, notRevoked],
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

  const summary = useMemo(() => pickVerifySummary(result), [result]);
  const nowMs = useMemo(() => Date.now(), [result]);
  const asOfMs = includeAsOf && asOf.trim() ? parseIsoMs(asOf.trim()) : null;
  const validUntilMs = parseIsoMs(summary?.validUntil);
  const expiredAgainstMs = asOfMs ?? nowMs;
  const isExpired = validUntilMs !== null ? validUntilMs < expiredAgainstMs : null;
  const expiredBySeconds =
    validUntilMs !== null ? secondsBetween(expiredAgainstMs, validUntilMs) : null;

  const outcome = useMemo(() => {
    if (loading) return { variant: "idle" as const, title: "Waiting", subtitle: "Request in progress…" };
    if (error) return { variant: "error" as const, title: "Request failed", subtitle: error };
    if (!result) return { variant: "idle" as const, title: "No response yet", subtitle: "Run a verify request." };
    if (summary?.ok === true) return { variant: "success" as const, title: "Verified", subtitle: "Policy checks passed." };
    if (summary?.ok === false) {
      const status = typeof summary.status === "string" ? summary.status : "failed";
      const reason = typeof summary.reason === "string" ? summary.reason : undefined;
      return {
        variant: "fail" as const,
        title: status === "expired" ? "Expired" : "Not verified",
        subtitle: reason ? `${status.toUpperCase()}: ${reason}` : status.toUpperCase(),
      };
    }
    return { variant: "idle" as const, title: "Unknown", subtitle: "Unexpected response shape." };
  }, [loading, error, result, summary?.ok, summary?.status, summary?.reason]);

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
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={includeAsOf}
                  type="checkbox"
                  onChange={(e) => setIncludeAsOf(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
                />
                <span className="text-zinc-300">Include asOf</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                  disabled={!includeAsOf}
                  className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm disabled:opacity-60"
                  placeholder="2025-12-15T17:10:00Z"
                />
                <button
                  type="button"
                  disabled={!includeAsOf}
                  onClick={() => setAsOf(toIsoDaysAgo(30))}
                  className="rounded border border-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900 disabled:opacity-60"
                >
                  30d ago
                </button>
                <button
                  type="button"
                  disabled={!includeAsOf}
                  onClick={() => setAsOf(toIsoNow())}
                  className="rounded border border-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900 disabled:opacity-60"
                >
                  Now
                </button>
              </div>
            </div>
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
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-start gap-3">
            <OutcomeGraphic variant={outcome.variant} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{outcome.title}</div>
              <div className="mt-0.5 text-xs text-zinc-400">{outcome.subtitle}</div>
            </div>
          </div>

          {summary ? (
            <div className="mt-4 grid gap-2 text-xs text-zinc-200">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                  <div className="text-zinc-400">Proof result</div>
                  <div className="mt-0.5 font-medium">{String(summary.attestationResult ?? "unknown")}</div>
                </div>
                <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                  <div className="text-zinc-400">Policy checks</div>
                  <div className="mt-0.5 font-medium">{summary.ok ? "pass" : "fail"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                  <div className="text-zinc-400">withinMaxAge</div>
                  <div className="mt-0.5 font-medium">{String(summary.withinMaxAge)}</div>
                </div>
                <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                  <div className="text-zinc-400">revoked</div>
                  <div className="mt-0.5 font-medium">{String(summary.revoked)}</div>
                </div>
              </div>

              {isExpired !== null ? (
                <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                  <div className="text-zinc-400">expired vs asOf/now</div>
                  <div className="mt-0.5 font-medium">
                    {String(isExpired)}
                    {isExpired && expiredBySeconds !== null ? ` (by ${expiredBySeconds}s)` : ""}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-1 text-zinc-300">
                {summary.bindingId ? (
                  <div>
                    <span className="text-zinc-400">bindingId:</span> {String(summary.bindingId)}
                  </div>
                ) : null}
                {summary.attestationId ? (
                  <div>
                    <span className="text-zinc-400">attestationId:</span> {String(summary.attestationId)}
                  </div>
                ) : null}
                {summary.signatureKid ? (
                  <div>
                    <span className="text-zinc-400">kid:</span> {String(summary.signatureKid)}
                  </div>
                ) : null}
                {summary.methodKind ? (
                  <div>
                    <span className="text-zinc-400">method:</span> {String(summary.methodKind)}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <JsonBlock title="Response JSON" value={result} />
      </div>
    </div>
  );
}
