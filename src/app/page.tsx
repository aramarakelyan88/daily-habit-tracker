"use client";

import { useState, useCallback, DragEvent, useMemo } from "react";
import { useHabitContext } from "@/context/HabitContext";
import { getCurrentWeek } from "@/lib/dates";
import AddHabitForm from "@/components/AddHabitForm";
import CalendarGrid from "@/components/CalendarGrid";
import HabitRow from "@/components/HabitRow";
import StatsPanel from "@/components/StatsPanel";
import ProgressRing from "@/components/ProgressRing";
import Confetti from "@/components/Confetti";
import UndoToast from "@/components/UndoToast";
import ThemeToggle from "@/components/ThemeToggle";
import WeeklyReview from "@/components/WeeklyReview";
import ExportImport from "@/components/ExportImport";

export default function Home() {
  const {
    habits,
    archivedHabits,
    isHydrated,
    undoAction,
    reorderHabits,
    restoreHabit,
    deleteHabit,
    isCompleted,
    performUndo,
    clearUndo,
  } = useHabitContext();

  const dates = useMemo(() => getCurrentWeek(), []);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Today's progress (captured on mount; matches the rendered week).
  const today = useMemo(() => new Date(), []);
  const todayCompleted = useMemo(
    () => habits.filter((h) => isCompleted(h.id, today)).length,
    [habits, isCompleted, today]
  );
  const allDone = habits.length > 0 && todayCompleted === habits.length;

  // Fire confetti once each time the user transitions into "all done".
  // Detecting the rising edge during render (React's "adjust state on prop
  // change" pattern) avoids both setState-in-effect and timers-in-render.
  const [confettiKey, setConfettiKey] = useState(0);
  const [prevAllDone, setPrevAllDone] = useState(allDone);
  if (allDone !== prevAllDone) {
    setPrevAllDone(allDone);
    if (allDone) setConfettiKey((k) => k + 1);
  }

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (toIndex: number) => {
      if (dragIndex !== null && dragIndex !== toIndex) {
        reorderHabits(dragIndex, toIndex);
      }
      setDragIndex(null);
    },
    [dragIndex, reorderHabits]
  );

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <Confetti fireKey={confettiKey} />

      <header className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-100">
            Daily Habit Tracker
          </h1>
          <div className="flex items-center gap-2">
            <ExportImport />
            <ThemeToggle />
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Build streaks. Track progress. Stay consistent.
          </p>
          <time className="text-sm font-medium text-zinc-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>
      </header>

      <div className="space-y-6">
        <AddHabitForm />

        {/* Progress ring */}
        {habits.length > 0 && (
          <div className="flex justify-center">
            <ProgressRing completed={todayCompleted} total={habits.length} />
          </div>
        )}

        {!isHydrated ? (
          <div className="py-12 text-center text-sm text-zinc-600">
            Loading...
          </div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <svg
              className="mb-4 h-24 w-24 text-zinc-700"
              fill="none"
              viewBox="0 0 120 120"
              stroke="currentColor"
              strokeWidth={1}
            >
              <rect x="20" y="30" width="80" height="70" rx="8" />
              <path d="M20 50h80" />
              <circle cx="42" cy="68" r="5" />
              <circle cx="60" cy="68" r="5" />
              <circle cx="78" cy="68" r="5" />
              <circle cx="42" cy="86" r="5" />
              <circle cx="60" cy="86" r="5" />
              <path d="M40 20v15M60 20v15M80 20v15" strokeLinecap="round" />
            </svg>
            <p className="text-lg font-medium text-zinc-400">
              No habits yet
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Add your first habit above and start building streaks!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div
              className="grid items-center gap-x-1 gap-y-2"
              style={{
                gridTemplateColumns: `minmax(140px, 1fr) repeat(${dates.length}, 40px) auto`,
              }}
            >
              <CalendarGrid dates={dates} />
              {habits.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  dates={dates}
                  index={index}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived habits */}
        {archivedHabits.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300"
            >
              <span>Archived ({archivedHabits.length})</span>
              <svg
                className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showArchived && (
              <div className="space-y-1 border-t border-zinc-800 px-4 py-3">
                {archivedHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span>{habit.emoji}</span>
                      <span className="text-sm text-zinc-400">{habit.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => restoreHabit(habit.id)}
                        className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-700 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <WeeklyReview />

        <StatsPanel />
      </div>

      <UndoToast
        action={undoAction}
        onUndo={performUndo}
        onDismiss={clearUndo}
      />
    </div>
  );
}
