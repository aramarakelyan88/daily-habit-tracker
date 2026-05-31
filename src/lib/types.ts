export type FrequencyType = "daily" | "weekdays" | "custom";

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  color: string;
  frequency: FrequencyType;
  customDays?: number[]; // 0=Sun..6=Sat, used when frequency === "custom"
  order: number;
  archived: boolean;
}

export type CompletionMap = Record<string, string[]>; // habitId -> dateString[]

export type NotesMap = Record<string, Record<string, string>>; // habitId -> { dateKey -> note }

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  completionRateWeek: number;
  completionRateMonth: number;
  totalCompletions: number;
}

export interface UndoAction {
  type: "toggle" | "delete" | "archive";
  description: string;
  undo: () => void;
}
