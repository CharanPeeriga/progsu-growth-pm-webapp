import { createBrowserClient } from "@supabase/ssr"
import type { DBTask } from "@/lib/types"

type TaskRow = DBTask
type TaskInsert = Omit<DBTask, "id" | "created_at" | "reminded_2day" | "reminded_day_of"> & {
  reminded_2day?: boolean
  reminded_day_of?: boolean
  created_at?: string
}
type TaskUpdate = Partial<Omit<DBTask, "id">>

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow
        Insert: TaskInsert
        Update: TaskUpdate
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  return url
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
  return key
}

export function getGuildId(): string {
  const id = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID
  if (!id) throw new Error("Missing NEXT_PUBLIC_DISCORD_GUILD_ID")
  return id
}

export function createBrowserSupabase() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey())
}
