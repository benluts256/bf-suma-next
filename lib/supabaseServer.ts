import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateEnv } from "@/lib/supabase-config";

export async function createSupabaseServerClient() {
  const { url, anonKey } = validateEnv();
  const cookieStore = await cookies();

  return _createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server Components are read-only; session refresh is handled by middleware
        },
      },
    }
  );
}
