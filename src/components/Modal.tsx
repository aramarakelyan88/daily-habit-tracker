"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** id of the heading that labels the dialog, for screen readers. */
  labelledBy?: string;
}

/**
 * Shared modal shell: dims the page, centers a panel, and closes on either
 * an Escape key press or a click on the backdrop. Clicks inside the panel do
 * not propagate, so interacting with the content never dismisses the dialog.
 */
export default function Modal({ onClose, children, labelledBy }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-800 p-6 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}
