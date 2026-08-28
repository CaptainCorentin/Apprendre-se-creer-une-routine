"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "./AppProvider";

const TABS = [
  { href: "/", label: "Aujourd'hui", icon: "🔥" },
  { href: "/journal", label: "Journal", icon: "📓" },
  { href: "/hall-of-fame", label: "Hall of Fame", icon: "🏆" },
  { href: "/settings", label: "Réglages", icon: "⚙️" },
];

export function NavBar() {
  const pathname = usePathname();
  const { ready, profileId, domains } = useAppContext();

  if (!ready || !profileId || domains.length === 0 || pathname === "/setup" || pathname === "/profiles") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 carbon-panel border-t border-border-subtle">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? "text-accent-strong" : "text-foreground-muted"
              }`}
            >
              <span className={`text-xl ${active ? "drop-shadow-[0_0_8px_rgba(255,45,62,0.6)]" : ""}`}>
                {tab.icon}
              </span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
