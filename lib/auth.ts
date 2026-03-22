import { createServerSupabaseClient } from "./supabase-server";
import { createAdminClient } from "./supabase-admin";
import type { User } from "./types";

/** Get the current session user and their profile */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/** Ensure a user profile exists after OTP login; create if missing */
export async function ensureUserProfile(
  userId: string,
  phone: string,
  name?: string
): Promise<User> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (existing) return existing;

  const { data: created, error } = await admin
    .from("users")
    .insert({
      id: userId,
      phone,
      name: name || null,
      role: "customer",
      notification_preference: "sms",
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error("Failed to create user profile: " + error?.message);
  }

  return created;
}
