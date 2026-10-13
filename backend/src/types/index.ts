export type Priority = 'low' | 'medium' | 'high';

export type TaskCategory = 'personal' | 'work' | 'study' | 'health' | 'other';

export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'custom';

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: Priority;
  category: TaskCategory;
  is_completed: boolean;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  recurrence_rule: string | null;
  category: TaskCategory;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface HydrationLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export interface UserPreferences {
  user_id: string;
  daily_water_goal_ml: number;
  water_reminder_interval_minutes: number;
  waking_time: string; // HH:mm format, e.g. "07:00"
  sleeping_time: string; // HH:mm format, e.g. "23:00"
  quiet_hours_enabled: boolean;
  notification_preferences: {
    reminders_sound: boolean;
    water_sound: boolean;
    vibration: boolean;
  };
  updated_at: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
}
