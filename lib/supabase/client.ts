import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

const DEFAULT_LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg1NzY5NTAwLCJleHAiOjE5NDM0NDk1MDB9.DPWuGe7RF7aTporw_NqMyB5mhT8hxWdVkAO4iqJ9-8k";

export function createClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:8000",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      DEFAULT_LOCAL_ANON_KEY
  );
}

export const createBrowserClient = createClient;
