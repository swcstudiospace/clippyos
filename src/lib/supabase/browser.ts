import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./public";

let browserClient: SupabaseClient | null = null;

/** Browser client for Supabase Auth (email). Publishable key only. */
export function getSupabaseBrowser(): SupabaseClient {
  browserClient ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}

/**
 * Best-effort: also create / sign in the operator in the Supabase project so
 * email accounts exist there. Workspace session still comes from Better Auth.
 * Never throws — login must not fail if this call is slow or rejected.
 */
export async function syncEmailAuthToSupabase(input: {
  mode: "signin" | "signup";
  email: string;
  password: string;
  name?: string;
}): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (input.mode === "signup") {
    await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name ?? "" } },
    });
    return;
  }
  await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
}
