import "~/styles/globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { NavLink } from "./_components/nav-link";

export const metadata: Metadata = {
  title: "PacStac API Demo",
  description: "Interactive demo for the PacStac Attestation API.",
};

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-50">
        <header className="border-b border-zinc-800">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-wide">
              PacStac API Demo
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-200">
              <NavLink href="/">Verify</NavLink>
              <NavLink href="/attestations">Attestations</NavLink>
              <NavLink href="/jwks">JWKS</NavLink>
              <NavLink href="/events">Binding Events</NavLink>
              <NavLink href="/offline-verify">Offline Verify</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{props.children}</main>
      </body>
    </html>
  );
}

