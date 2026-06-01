export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TeamName = 'growth' | 'tech' | 'operations' | 'progirls';

export interface DBTask {
  id: number;
  guild_id: string;
  assignee_id: string;
  assigner_id: string;
  task_name: string;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
  reminded: boolean;
  reminded_2day: boolean;
  reminded_day_of: boolean;
  rejection_reason: string | null;
  team: TeamName;
}

export interface NewTask {
  assignee_id: string;
  task_name: string;
  due_date: string | null;
  status: TaskStatus;
}

export interface TeamMember {
  id: number;
  guild_id: string;
  user_id: string;
  display_name: string | null;
  added_at: string;
  team: TeamName;
}

export interface VPRole {
  id: number;
  guild_id: string;
  user_id: string;
  team: TeamName;
  added_by: string | null;
  added_at: string;
}

export interface TeamChannel {
  id: number;
  guild_id: string;
  team: TeamName;
  channel_id: string;
}

export interface TaskCollaborator {
  id: number;
  task_id: number;
  user_id: string;
  submitted: boolean;
  submitted_at: string | null;
}

export interface GuildCalendarEvent {
  id: number;
  guild_id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  color: string;
  location: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewGuildCalendarEvent {
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  color?: string;
  location?: string;
}
