"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "For You" },
  { href: "/saved", label: "Saved" },
  { href: "/trips", label: "Trips" },
  { href: "/profile", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-auto z-30 flex shrink-0 items-center justify-around border-t border-white/10 bg-black/60 py-2 backdrop-blur-md">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-1.5 text-xs"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
            />
            <span className={active ? "font-semibold text-white" : "text-secondary"}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
