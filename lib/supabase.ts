// Re-export all clients from their respective files
// Server-side: import from @/lib/supabase-server
// Client-side: import createBrowserClient from @/lib/supabase-browser
// Admin: import createAdminClient from @/lib/supabase-admin

export { createBrowserClient } from "./supabase-browser";
export { createServerSupabaseClient } from "./supabase-server";
export { createAdminClient } from "./supabase-admin";
