import type { SupabaseClient } from "@supabase/supabase-js"
import type { DBTask, NewTask } from "@/lib/types"

type Client = SupabaseClient

export async function fetchAllTasks(client: Client, guildId: string): Promise<DBTask[]> {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("guild_id", guildId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as DBTask[]
}

export async function insertTask(
  client: Client,
  task: NewTask & { guild_id: string }
): Promise<DBTask> {
  const payload = {
    guild_id: task.guild_id,
    assignee_id: task.assignee_id,
    assigner_id: "dashboard",
    task_name: task.task_name,
    due_date: task.due_date,
    status: task.status,
    reminded_2day: false,
    reminded_day_of: false,
  }

  const { data, error } = await client
    .from("tasks")
    .insert(payload)
    .select("*")
    .single()

  if (error) throw error
  return data as DBTask
}

export async function updateTask(
  client: Client,
  id: number,
  updates: Partial<DBTask>
): Promise<DBTask> {
  const { data, error } = await client
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as DBTask
}

export async function deleteTask(client: Client, id: number): Promise<void> {
  const { error } = await client.from("tasks").delete().eq("id", id)
  if (error) throw error
}
