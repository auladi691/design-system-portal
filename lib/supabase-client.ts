import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

const FALLBACK_URL = "https://nacuyrfyuimawjdvbsps.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3V5cmZ5dWltYXdqZHZic3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTI1OTAsImV4cCI6MjA5OTk4ODU5MH0.1fvIo1LGFUvCQwcyIEQ4wiWNkt5tUCZONwybdV2-34c";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

export function getSupabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  const { url, anonKey, configured } = getSupabaseConfig();
  if (!configured || !url || !anonKey) {
    cachedClient = null;
    return null;
  }
  cachedClient = createBrowserClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    realtime: { params: { eventsPerSecond: 2 } },
  });
  return cachedClient;
}

export const STORAGE_BUCKET = "design-system-assets";
