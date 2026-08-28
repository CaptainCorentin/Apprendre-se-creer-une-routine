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
import { clearStoredProfileId, getStoredProfileId, listProfiles, storeProfileId } from "@/lib/profiles";
import { checkJournalDue } from "@/lib/journalStatus";

interface AppContextValue {
  profileId: string | null;
  domains: Domain[];
  activeDomains: Domain[];
  loading: boolean;
  ready: boolean;
  refreshDomains: () => Promise<void>;
  loginAs: (profileId: string) => void;
  logout: () => void;
  journalDue: boolean;
  refreshJournalDue: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [journalDue, setJournalDue] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const refreshJournalDue = useCallback(async () => {
    if (!profileId) return;
    const status = await checkJournalDue(profileId);
    setJournalDue(status.weekly || status.monthly);
  }, [profileId]);

  const refreshDomains = useCallback(async () => {
    if (!profileId) return;
    const list = await fetchDomains(profileId);
    setDomains(list);
  }, [profileId]);

  const logout = useCallback(() => {
    clearStoredProfileId();
    setProfileId(null);
    setDomains([]);
    setJournalDue(false);
    router.replace("/profiles");
  }, [router]);

  const loginAs = useCallback((id: string) => {
    storeProfileId(id);
    setProfileId(id);
  }, []);

  // Résolution du profil courant : aucun profil en base -> bootstrap sur /profiles ;
  // profil déjà stocké et toujours valide -> on reste connecté ; sinon -> /profiles.
  useEffect(() => {
    let cancelled = false;

    async function resolveProfile() {
      const profiles = await listProfiles();
      if (cancelled) return;

      if (profiles.length === 0) {
        setProfileId(null);
        setLoading(false);
        setReady(true);
        return;
      }

      const stored = getStoredProfileId();
      if (stored && profiles.some((p) => p.id === stored)) {
        setProfileId(stored);
      } else {
        clearStoredProfileId();
        setProfileId(null);
        setLoading(false);
        setReady(true);
      }
    }

    resolveProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const list = await fetchDomains(profileId!);
        if (cancelled) return;
        setDomains(list);

        const active = list.filter((d) => d.active);
        if (active.length > 0) {
          await backfillMissedCheckins(profileId!, active);
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
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    checkJournalDue(profileId).then((status) => setJournalDue(status.weekly || status.monthly));
  }, [profileId]);

  useEffect(() => {
    if (!ready) return;

    if (!profileId) {
      if (pathname !== "/profiles") router.replace("/profiles");
      return;
    }

    if (pathname === "/profiles") {
      router.replace("/");
      return;
    }

    const hasDomains = domains.length > 0;
    if (!hasDomains && pathname !== "/setup") {
      router.replace("/setup");
    } else if (hasDomains && pathname === "/setup") {
      router.replace("/");
    }
  }, [ready, profileId, domains, pathname, router]);

  const activeDomains = domains.filter((d) => d.active);

  return (
    <AppContext.Provider
      value={{
        profileId,
        domains,
        activeDomains,
        loading,
        ready,
        refreshDomains,
        loginAs,
        logout,
        journalDue,
        refreshJournalDue,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
