"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import {
  createProfile,
  listProfiles,
  setProfilePhoto,
  uploadProfilePhoto,
  verifyProfilePassword,
  type ProfileSummary,
} from "@/lib/profiles";

export default function ProfilesPage() {
  const { loginAs } = useAppContext();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listProfiles().then((list) => {
      setProfiles(list);
      if (list.length > 0) setSelectedId(list[0].id);
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyProfilePassword(selectedId, password);
      if (!ok) {
        setError("Mot de passe incorrect.");
        return;
      }
      loginAs(selectedId);
      router.replace("/");
    } catch (err) {
      setError("Une erreur est survenue. Réessaie.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateFirstProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || password.length < 4) {
      setError("Nom requis et mot de passe d'au moins 4 caractères.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await createProfile(name.trim(), password);
      if (photo) {
        const url = await uploadProfilePhoto(id, photo);
        await setProfilePhoto(id, url);
      }
      loginAs(id);
      router.replace("/");
    } catch (err) {
      setError("Une erreur est survenue. Réessaie.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  if (profiles === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-foreground-muted">
        Chargement…
      </div>
    );
  }

  const bootstrap = profiles.length === 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-8 text-center">
        <p className="text-5xl">🔥</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {bootstrap ? "Crée ton profil" : "Qui es-tu ?"}
        </h1>
        {bootstrap && (
          <p className="mt-2 text-sm text-foreground-muted">
            Premier lancement : crée ton profil personnel pour commencer.
          </p>
        )}
      </div>

      {bootstrap ? (
        <form onSubmit={handleCreateFirstProfile} className="carbon-panel space-y-3 rounded-2xl p-4">
          <input
            type="text"
            placeholder="Ton prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <label className="block text-xs text-foreground-muted">
            Photo de profil (optionnel)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-xs text-foreground-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-raised file:px-3 file:py-1.5 file:text-xs file:text-foreground-muted"
            />
          </label>
          {error && <p className="text-sm text-accent-strong">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
          >
            {busy ? "Création…" : "Créer mon profil"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="carbon-panel space-y-3 rounded-2xl p-4">
          <div className="flex flex-wrap justify-center gap-3">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2 transition ${
                  selectedId === p.id ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-surface-raised"
                }`}
              >
                <Avatar name={p.name} photoUrl={p.photo_url} size={48} />
                <span className="text-xs text-foreground-muted">{p.name}</span>
              </button>
            ))}
          </div>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-accent-strong">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
          >
            {busy ? "Connexion…" : "Entrer"}
          </button>
        </form>
      )}
    </div>
  );
}
