import { supabase } from "./supabase";

export interface ProfileSummary {
  id: string;
  name: string;
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  const { data, error } = await supabase.rpc("list_profiles");
  if (error) throw error;
  return data ?? [];
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
