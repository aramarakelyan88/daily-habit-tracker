"use client";

import { useState } from "react";
import Modal from "./Modal";

interface NoteModalProps {
  habitName: string;
  dateLabel: string;
  initialNote: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

export default function NoteModal({
  habitName,
  dateLabel,
  initialNote,
  onSave,
  onClose,
}: NoteModalProps) {
  const [note, setNote] = useState(initialNote);

  return (
    <Modal onClose={onClose} labelledBy="note-modal-title">
      <h3 id="note-modal-title" className="text-lg font-semibold text-zinc-100">
        Add Note
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        {habitName} &middot; {dateLabel}
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Ran 5k, read 30 pages..."
        rows={3}
        className="mt-3 w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500"
        autoFocus
      />
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onSave(note);
            onClose();
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
