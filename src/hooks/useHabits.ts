"use client";

import { useCallback, useState } from "react";
import {
  Habit,
  CompletionMap,
  NotesMap,
  HabitStats,
  UndoAction,
  FrequencyType,
} from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/storage";
import {
  toDateKey,
  getLastNDays,
  calculateCurrentStreak,
  calculateBestStreak,
} from "@/lib/dates";
import { useLocalStorage } from "./useLocalStorage";

const COLORS = [
  "#6366f1", // indigo
  "#f43f5e", // rose
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#ef4444", // red
];

const DEFAULT_EMOJIS = ["📝", "💪", "📚", "🧘", "🏃", "💧", "🎯", "✍️"];

export function useHabits() {
  const [habits, setHabits, habitsHydrated] = useLocalStorage<Habit[]>(
    STORAGE_KEYS.HABITS,
    []
  );
  const [completions, setCompletions, completionsHydrated] =
    useLocalStorage<CompletionMap>(STORAGE_KEYS.COMPLETIONS, {});
  const [notes, setNotes, notesHydrated] = useLocalStorage<NotesMap>(
    STORAGE_KEYS.NOTES,
    {}
  );

  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  const isHydrated = habitsHydrated && completionsHydrated && notesHydrated;

  // Migrate old habits that lack new fields
  const migratedHabits = habits.map((h, i) => ({
    ...h,
    emoji: h.emoji || DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length],
    frequency: h.frequency || ("daily" as const),
    order: h.order ?? i,
    archived: h.archived ?? false,
  }));

  const activeHabits = migratedHabits
    .filter((h) => !h.archived)
    .sort((a, b) => a.order - b.order);

  const archivedHabits = migratedHabits
    .filter((h) => h.archived)
    .sort((a, b) => a.order - b.order);

  const addHabit = useCallback(
    (
      name: string,
      emoji?: string,
      frequency: FrequencyType = "daily",
      customDays?: number[]
    ) => {
      const habit: Habit = {
        id: crypto.randomUUID(),
        name: name.trim(),
        emoji: emoji || DEFAULT_EMOJIS[habits.length % DEFAULT_EMOJIS.length],
        createdAt: new Date().toISOString(),
        color: COLORS[habits.length % COLORS.length],
        frequency,
        customDays: frequency === "custom" ? customDays : undefined,
        order: habits.length,
        archived: false,
      };
      setHabits((prev) => [...prev, habit]);
    },
    [habits.length, setHabits]
  );

  const deleteHabit = useCallback(
    (id: string) => {
      const habit = habits.find((h) => h.id === id);
      const prevCompletions = completions[id];
      const prevNotes = notes[id];

      setHabits((prev) => prev.filter((h) => h.id !== id));
      setCompletions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      if (habit) {
        setUndoAction({
          type: "delete",
          description: `Deleted "${habit.name}"`,
          undo: () => {
            setHabits((prev) => [...prev, habit]);
            if (prevCompletions) {
              setCompletions((prev) => ({ ...prev, [id]: prevCompletions }));
            }
            if (prevNotes) {
              setNotes((prev) => ({ ...prev, [id]: prevNotes }));
            }
          },
        });
      }
    },
    [habits, completions, notes, setHabits, setCompletions, setNotes]
  );

  const toggleCompletion = useCallback(
    (habitId: string, date: Date) => {
      const key = toDateKey(date);
      setCompletions((prev) => {
        const dates = prev[habitId] || [];
        const exists = dates.includes(key);
        return {
          ...prev,
          [habitId]: exists ? dates.filter((d) => d !== key) : [...dates, key],
        };
      });

      const habit = habits.find((h) => h.id === habitId);
      const wasCompleted = (completions[habitId] || []).includes(key);
      setUndoAction({
        type: "toggle",
        description: wasCompleted
          ? `Unmarked "${habit?.name}"`
          : `Completed "${habit?.name}"`,
        undo: () => {
          setCompletions((prev) => {
            const dates = prev[habitId] || [];
            const exists = dates.includes(key);
            return {
              ...prev,
              [habitId]: exists
                ? dates.filter((d) => d !== key)
                : [...dates, key],
            };
          });
        },
      });
    },
    [habits, completions, setCompletions]
  );

  const isCompleted = useCallback(
    (habitId: string, date: Date): boolean => {
      const key = toDateKey(date);
      return (completions[habitId] || []).includes(key);
    },
    [completions]
  );

  const archiveHabit = useCallback(
    (id: string) => {
      const habit = habits.find((h) => h.id === id);
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, archived: true } : h))
      );
      if (habit) {
        setUndoAction({
          type: "archive",
          description: `Archived "${habit.name}"`,
          undo: () => {
            setHabits((prev) =>
              prev.map((h) => (h.id === id ? { ...h, archived: false } : h))
            );
          },
        });
      }
    },
    [habits, setHabits]
  );

  const restoreHabit = useCallback(
    (id: string) => {
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, archived: false } : h))
      );
    },
    [setHabits]
  );

  const reorderHabits = useCallback(
    (fromIndex: number, toIndex: number) => {
      setHabits((prev) => {
        const active = prev
          .filter((h) => !h.archived)
          .sort((a, b) => a.order - b.order);
        const archived = prev.filter((h) => h.archived);

        const [moved] = active.splice(fromIndex, 1);
        active.splice(toIndex, 0, moved);

        const reordered = active.map((h, i) => ({ ...h, order: i }));
        return [...reordered, ...archived];
      });
    },
    [setHabits]
  );

  const updateHabit = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<Habit, "name" | "emoji" | "color" | "frequency" | "customDays">
      >
    ) => {
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
      );
    },
    [setHabits]
  );

  const addNote = useCallback(
    (habitId: string, dateKey: string, note: string) => {
      setNotes((prev) => ({
        ...prev,
        [habitId]: {
          ...(prev[habitId] || {}),
          [dateKey]: note,
        },
      }));
    },
    [setNotes]
  );

  const getNote = useCallback(
    (habitId: string, dateKey: string): string => {
      return notes[habitId]?.[dateKey] || "";
    },
    [notes]
  );

  const clearUndo = useCallback(() => {
    setUndoAction(null);
  }, []);

  const performUndo = useCallback(() => {
    if (undoAction) {
      undoAction.undo();
      setUndoAction(null);
    }
  }, [undoAction]);

  const isDueOnDate = useCallback((habit: Habit, date: Date): boolean => {
    if (habit.frequency === "daily") return true;
    const day = date.getDay();
    if (habit.frequency === "weekdays") return day >= 1 && day <= 5;
    if (habit.frequency === "custom" && habit.customDays) {
      return habit.customDays.includes(day);
    }
    return true;
  }, []);

  const getStats = useCallback(
    (habitId: string): HabitStats => {
      const dates = completions[habitId] || [];
      const habit = habits.find((h) => h.id === habitId);
      const weekDates = getLastNDays(7);
      const monthDates = getLastNDays(30);

      // A day counts toward the rate only if the habit was due on it, so the
      // numerator and denominator stay consistent (rate can never exceed 100%).
      const due = (d: Date) => (habit ? isDueOnDate(habit, d) : true);
      const weekDue = weekDates.filter(due).length;
      const monthDue = monthDates.filter(due).length;
      const weekCompleted = weekDates.filter(
        (d) => due(d) && dates.includes(toDateKey(d))
      ).length;
      const monthCompleted = monthDates.filter(
        (d) => due(d) && dates.includes(toDateKey(d))
      ).length;

      return {
        currentStreak: calculateCurrentStreak(dates),
        bestStreak: calculateBestStreak(dates),
        completionRateWeek:
          weekDue > 0 ? Math.round((weekCompleted / weekDue) * 100) : 0,
        completionRateMonth:
          monthDue > 0 ? Math.round((monthCompleted / monthDue) * 100) : 0,
        totalCompletions: dates.length,
      };
    },
    [completions, habits, isDueOnDate]
  );

  const exportData = useCallback(() => {
    const data = { habits, completions, notes };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-tracker-${toDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [habits, completions, notes]);

  const importData = useCallback(
    (json: string) => {
      try {
        const data = JSON.parse(json);
        if (!data || typeof data !== "object") return false;

        // Validate shape before overwriting persisted state, so a malformed
        // or unrelated file can't corrupt the user's habits.
        const isPlainObject = (v: unknown) =>
          v != null && typeof v === "object" && !Array.isArray(v);

        const validHabits =
          Array.isArray(data.habits) &&
          data.habits.every(
            (h: unknown) =>
              isPlainObject(h) &&
              typeof (h as Habit).id === "string" &&
              typeof (h as Habit).name === "string"
          );
        const validCompletions =
          data.completions == null || isPlainObject(data.completions);
        const validNotes = data.notes == null || isPlainObject(data.notes);

        if (!validHabits || !validCompletions || !validNotes) return false;

        setHabits(data.habits);
        if (data.completions) setCompletions(data.completions);
        if (data.notes) setNotes(data.notes);
        return true;
      } catch {
        return false;
      }
    },
    [setHabits, setCompletions, setNotes]
  );

  return {
    habits: activeHabits,
    archivedHabits,
    completions,
    notes,
    isHydrated,
    undoAction,
    addHabit,
    deleteHabit,
    toggleCompletion,
    isCompleted,
    archiveHabit,
    restoreHabit,
    reorderHabits,
    updateHabit,
    addNote,
    getNote,
    clearUndo,
    performUndo,
    isDueOnDate,
    getStats,
    exportData,
    importData,
  };
}
