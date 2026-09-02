"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "./AppProvider";
import {
  createProfile,
  listProfiles,
  setAcceptsPiquant,
  setProfilePassword,
  type ProfileSummary,
} from "@/lib/profiles";

export function ProfilesSettings() {
  const { profileId, logout } = useAppContext();
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    listProfiles().then(setProfiles);
  }, []);

  async function toggleAcceptsPiquant(value: boolean) {
    if (!profileId) return;
    await setAcceptsPiquant(profileId, value);
    setProfiles(await listProfiles());
  }

  async function handleAddProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || password.length < 4) {
      setError("Nom requis et mot de passe d'au moins 4 caractères.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await createProfile(name.trim(), password);
      setName("");
      setPassword("");
      setSuccess(`Profil "${name.trim()}" créé.`);
      setProfiles(await listProfiles());
    } catch (err) {
      setError("Une erreur est survenue (le nom est peut-être déjà pris).");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId || newPassword.length < 4) {
      setPwError("Le nouveau mot de passe doit faire au moins 4 caractères.");
      return;
    }
    setPwError(null);
    setPwSuccess(false);
    try {
      const ok = await setProfilePassword(profileId, oldPassword, newPassword);
      if (!ok) {
        setPwError("Mot de passe actuel incorrect.");
        return;
      }
      setOldPassword("");
      setNewPassword("");
      setPwSuccess(true);
    } catch (err) {
      setPwError("Une erreur est survenue.");
      console.error(err);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-foreground-muted">Profils</h2>

      <div className="mt-3 space-y-2">
        {profiles.map((p) => (
          <div key={p.id} className="carbon-panel flex items-center justify-between rounded-xl p-3">
            <span className="text-sm">{p.name}</span>
            {p.id === profileId && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent-strong">
                Toi
              </span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleAddProfile} className="carbon-panel mt-4 rounded-xl p-3">
        <p className="mb-2 text-xs font-medium text-foreground-muted">Ajouter un profil</p>
        <div className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Prénom"
            className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe (4 caractères min.)"
            className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        {error && <p className="mt-2 text-xs text-accent-strong">{error}</p>}
        {success && <p className="mt-2 text-xs text-success">{success}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-3 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="carbon-panel mt-4 rounded-xl p-3">
        <p className="mb-2 text-xs font-medium text-foreground-muted">Changer mon mot de passe</p>
        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Mot de passe actuel"
            className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        {pwError && <p className="mt-2 text-xs text-accent-strong">{pwError}</p>}
        {pwSuccess && <p className="mt-2 text-xs text-success">Mot de passe mis à jour.</p>}
        <button
          type="submit"
          className="mt-3 w-full rounded-lg border border-border-subtle py-2 text-sm font-medium text-foreground-muted hover:border-accent hover:text-accent-strong"
        >
          Mettre à jour
        </button>
      </form>

      <div className="carbon-panel mt-4 flex items-center justify-between rounded-xl p-3">
        <div>
          <p className="text-xs font-medium">Recevoir des piques (Entre nous)</p>
          <p className="mt-0.5 text-[11px] text-foreground-muted">
            Désactive pour ne recevoir que des encouragements.
          </p>
        </div>
        <button
          onClick={() => toggleAcceptsPiquant(!(profiles.find((p) => p.id === profileId)?.accepts_piquant ?? true))}
          className={`h-6 w-11 shrink-0 rounded-full transition ${
            profiles.find((p) => p.id === profileId)?.accepts_piquant ? "bg-accent" : "bg-surface-raised"
          }`}
          aria-label="Recevoir des piques"
        >
          <span
            className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition ${
              profiles.find((p) => p.id === profileId)?.accepts_piquant ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <button
        onClick={logout}
        className="mt-4 w-full rounded-lg border border-border-subtle py-2 text-sm font-medium text-foreground-muted hover:border-accent hover:text-accent-strong"
      >
        Changer de profil
      </button>
    </section>
  );
}
