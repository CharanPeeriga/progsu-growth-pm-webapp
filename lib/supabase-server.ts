import "server-only"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseAnonKey, getSupabaseUrl, type Database } from "@/lib/supabase"

export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(
            ({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
              cookieStore.set(name, value, options)
            }
          )
        } catch {
          // Server Components cannot set cookies. Middleware refreshes the session.
        }
      },
    },
  })
}
