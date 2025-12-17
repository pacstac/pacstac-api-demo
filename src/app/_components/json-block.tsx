"use client";

import { useMemo, useState } from "react";

function stringifySafe(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function JsonBlock(props: Readonly<{ title: string; value: unknown }>) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => stringifySafe(props.value), [props.value]);

  async function onCopy() {
    if (typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-zinc-300">{props.title}</div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded border border-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[520px] overflow-auto rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100">
        {text}
      </pre>
    </section>
  );
}

