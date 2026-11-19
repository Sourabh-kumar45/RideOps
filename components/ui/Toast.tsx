"use client";

/** A confirmation message in the bottom-right corner that hides itself after a few seconds. */
import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

export interface ToastMessage {
  /** A new id for every message, so the same text can show twice. */
  id: number;
  title: string;
  detail?: string;
}

const VISIBLE_MS = 6000;

export function Toast({ message, onClose }: { message: ToastMessage | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-5 z-50 flex w-[min(24rem,calc(100vw-2.5rem))] items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-pop"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-medium">{message.title}</p>
        {message.detail && <p className="mt-0.5 text-stone-300">{message.detail}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="text-stone-400 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
