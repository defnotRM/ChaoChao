import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "http://localhost:8000";

const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-key";

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

export { createClient as createBrowserClient } from "./supabase/client";
export { createClient as createServerClient } from "./supabase/server";
export { createAdminClient } from "./supabase/admin";
export { getCurrentUser } from "./supabase/auth";