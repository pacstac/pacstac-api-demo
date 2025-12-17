"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/cn";

export function NavLink(props: Readonly<{ href: string; children: React.ReactNode }>) {
  const pathname = usePathname();
  const active = pathname === props.href;
  return (
    <Link
      href={props.href}
      className={cn(
        "rounded px-2 py-1 transition hover:bg-zinc-900 hover:text-zinc-50",
        active ? "bg-zinc-900 text-zinc-50" : "text-zinc-300",
      )}
    >
      {props.children}
    </Link>
  );
}

