import { supabase } from "./supabase";

export interface ProfileSummary {
  id: string;
  name: string;
  accepts_piquant: boolean;
  shows_monday_recap: boolean;
  photo_url: string | null;
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  const { data, error } = await supabase.rpc("list_profiles");
  if (error) throw error;
  return data ?? [];
}

export async function setAcceptsPiquant(profileId: string, value: boolean): Promise<void> {
  const { error } = await supabase.rpc("set_accepts_piquant", { p_profile_id: profileId, p_value: value });
  if (error) throw error;
}

export async function setShowsMondayRecap(profileId: string, value: boolean): Promise<void> {
  const { error } = await supabase.rpc("set_shows_monday_recap", { p_profile_id: profileId, p_value: value });
  if (error) throw error;
}

export async function setProfilePhoto(profileId: string, photoUrl: string | null): Promise<void> {
  const { error } = await supabase.rpc("set_profile_photo", { p_profile_id: profileId, p_photo_url: photoUrl });
  if (error) throw error;
}

/** Upload la photo d'un profil (remplace l'ancienne s'il y en avait une). */
export async function uploadProfilePhoto(profileId: string, file: File): Promise<string> {
  const { data: existingFiles } = await supabase.storage.from("profile-photos").list(profileId);
  if (existingFiles && existingFiles.length > 0) {
    await supabase.storage.from("profile-photos").remove(existingFiles.map((f) => `${profileId}/${f.name}`));
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${profileId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createProfile(name: string, password: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_profile", { p_name: name, p_password: password });
  if (error) throw error;
  return data as string;
}

export async function verifyProfilePassword(profileId: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_profile_password", {
    p_profile_id: profileId,
    p_password: password,
  });
  if (error) throw error;
  return !!data;
}

export async function setProfilePassword(
  profileId: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("set_profile_password", {
    p_profile_id: profileId,
    p_old_password: oldPassword,
    p_new_password: newPassword,
  });
  if (error) throw error;
  return !!data;
}

const STORAGE_KEY = "routine:profile-id";

export function getStoredProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function storeProfileId(profileId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, profileId);
}

export function clearStoredProfileId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
