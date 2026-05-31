"use client";

import { useState, DragEvent } from "react";
import { Habit } from "@/lib/types";
import { toDateKey, getDateLabel } from "@/lib/dates";
import { useHabitContext } from "@/context/HabitContext";
import StreakBadge from "./StreakBadge";
import ConfirmDialog from "./ConfirmDialog";
import NoteModal from "./NoteModal";
import EditHabitModal from "./EditHabitModal";

interface HabitRowProps {
  habit: Habit;
  dates: Date[];
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}

export default function HabitRow({
  habit,
  dates,
  index,
  onDragStart,
  onDragOver,
  onDrop,
}: HabitRowProps) {
  const {
    toggleCompletion,
    isCompleted,
    getStats,
    deleteHabit,
    archiveHabit,
    updateHabit,
    addNote,
    getNote,
    isDueOnDate,
  } = useHabitContext();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [noteModal, setNoteModal] = useState<{
    open: boolean;
    dateKey: string;
    dateLabel: string;
  }>({ open: false, dateKey: "", dateLabel: "" });
  const stats = getStats(habit.id);

  return (
    <>
      {/* Habit name cell with drag handle */}
      <div
        className="flex items-center gap-1.5 overflow-hidden pr-2"
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={() => onDrop(index)}
      >
        <span className="cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </span>
        <span className="text-base" title={habit.name}>
          {habit.emoji}
        </span>
        <span className="truncate text-sm text-zinc-200">{habit.name}</span>
      </div>

      {/* Checkbox cells */}
      {dates.map((date) => {
        const completed = isCompleted(habit.id, date);
        const dateKey = toDateKey(date);
        const due = isDueOnDate(habit, date);
        const note = getNote(habit.id, dateKey);

        return (
          <button
            key={dateKey}
            onClick={() => {
              if (due) toggleCompletion(habit.id, date);
            }}
            onDoubleClick={() => {
              if (completed) {
                setNoteModal({
                  open: true,
                  dateKey,
                  dateLabel: getDateLabel(date),
                });
              }
            }}
            className={`relative flex h-8 w-8 items-center justify-center justify-self-center rounded-md border ${
              !due
                ? "border-zinc-800 opacity-30 cursor-not-allowed"
                : completed
                  ? "border-transparent"
                  : "border-zinc-700 hover:border-zinc-500"
            }`}
            style={
              completed
                ? { backgroundColor: habit.color + "cc" }
                : undefined
            }
            aria-label={`${habit.name} ${dateKey} ${completed ? "completed" : "not completed"}`}
            title={note ? `📝 ${note}` : undefined}
          >
            {completed && (
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {note && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
            )}
          </button>
        );
      })}

      {/* Actions cell */}
      <div className="flex items-center gap-1.5 pl-2">
        <StreakBadge streak={stats.currentStreak} />
        <button
          onClick={() => setEditOpen(true)}
          className="rounded p-1 text-zinc-600 hover:text-indigo-400"
          aria-label={`Edit ${habit.name}`}
          title="Edit"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => archiveHabit(habit.id)}
          className="rounded p-1 text-zinc-600 hover:text-amber-400"
          aria-label={`Archive ${habit.name}`}
          title="Archive"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded p-1 text-zinc-600 hover:text-red-400"
          aria-label={`Delete ${habit.name}`}
          title="Delete"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Habit"
        message={`Are you sure you want to delete "${habit.name}"? All completion data will be lost.`}
        onConfirm={() => {
          deleteHabit(habit.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {noteModal.open && (
        <NoteModal
          habitName={habit.name}
          dateLabel={noteModal.dateLabel}
          initialNote={getNote(habit.id, noteModal.dateKey)}
          onSave={(note) => addNote(habit.id, noteModal.dateKey, note)}
          onClose={() => setNoteModal({ open: false, dateKey: "", dateLabel: "" })}
        />
      )}

      {editOpen && (
        <EditHabitModal
          habit={habit}
          onSave={(updates) => updateHabit(habit.id, updates)}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
