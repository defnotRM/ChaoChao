import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:8000",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      "placeholder-key"
  );
}

export const createBrowserClient = createClient;
