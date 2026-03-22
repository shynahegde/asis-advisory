"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserClient: ReturnType<typeof createClient<any>> | null = null;

/**
 * Browser (client-side) Supabase client.
 * Singleton to avoid multiple instances in client components.
 */
export function createBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
