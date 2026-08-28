"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Domain } from "@/types/database";
import { backfillMissedCheckins, fetchDomains } from "@/lib/data";

interface AppContextValue {
  domains: Domain[];
  activeDomains: Domain[];
  loading: boolean;
  ready: boolean;
  refreshDomains: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const refreshDomains = useCallback(async () => {
    const list = await fetchDomains();
    setDomains(list);
    return;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const list = await fetchDomains();
        if (cancelled) return;
        setDomains(list);

        const active = list.filter((d) => d.active);
        if (active.length > 0) {
          await backfillMissedCheckins(active);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setReady(true);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const hasDomains = domains.length > 0;
    if (!hasDomains && pathname !== "/setup") {
      router.replace("/setup");
    } else if (hasDomains && pathname === "/setup") {
      router.replace("/");
    }
  }, [ready, domains, pathname, router]);

  const activeDomains = domains.filter((d) => d.active);

  return (
    <AppContext.Provider value={{ domains, activeDomains, loading, ready, refreshDomains }}>
      {children}
    </AppContext.Provider>
  );
}
