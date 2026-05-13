export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

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
}
