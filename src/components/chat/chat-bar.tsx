"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, Plus } from "lucide-react";
import { createExperience } from "@/app/actions/experiences";
import type { ExperienceDraft } from "@/lib/ai/types";
import { DraftCard, type DraftState } from "./draft-card";
import { StructuredEntry } from "./structured-entry";

/**
 * The pinned capture bar.
 *
 * Chat is the primary interface, but the structured form sits one tap away
 * rather than behind a different screen — some things are faster to type into
 * boxes, and the PRD asks for both.
 */
export function ChatBar({ skills }: { skills: { id: string; name: string }[] }) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [drafts, setDrafts] = useState<DraftState[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [knownSkills, setKnownSkills] = useState(skills);
  const [showForm, setShowForm] = useState(false);
  const [saving, startSaving] = useTransition();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value || thinking) return;

    setThinking(true);
    setMessage(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "That didn't work. Try the form instead.");
        return;
      }

      const items: ExperienceDraft[] = data.items ?? [];
      setDrafts(
        items.map((item, index) => ({
          ...item,
          localId: `${Date.now()}-${index}`,
        })),
      );
      if (Array.isArray(data.knownSkills)) setKnownSkills(data.knownSkills);

      setMessage(
        data.clarification ??
          (items.length === 0 ? "I couldn't find an experience in that." : null),
      );
      if (items.length > 0) setText("");
    } catch {
      setMessage("Couldn't reach the server. Your text is still here.");
    } finally {
      setThinking(false);
    }
  }

  function saveDraft(draft: DraftState) {
    startSaving(async () => {
      try {
        await createExperience({
          title: draft.title,
          notes: draft.notes,
          occurredAt: draft.occurredAt,
          minutes: draft.minutes,
          skillNames: draft.skills,
          source: "CHAT",
          rawInput: text || null,
          confidence: draft.confidence,
        });
        setDrafts((prev) => prev.filter((d) => d.localId !== draft.localId));
        setMessage("Recorded.");
        router.refresh();
      } catch {
        setMessage("Couldn't save that one. Try again?");
      }
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {drafts.length > 0 && (
          <div className="mb-3 space-y-2">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.localId}
                draft={draft}
                knownSkills={knownSkills}
                saving={saving}
                onSave={saveDraft}
                onDismiss={(id) =>
                  setDrafts((prev) => prev.filter((d) => d.localId !== id))
                }
              />
            ))}
          </div>
        )}

        {showForm && (
          <div className="mb-3">
            <StructuredEntry
              skills={knownSkills}
              onDone={() => {
                setShowForm(false);
                setMessage("Recorded.");
                router.refresh();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {message && (
          <p className="mb-2 text-sm text-muted" role="status">
            {message}
          </p>
        )}

        <form onSubmit={submit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            aria-label="Add with a form instead"
            aria-expanded={showForm}
            className="shrink-0 rounded-full border border-line p-2.5 text-muted transition-colors hover:bg-line/50 hover:text-ink"
          >
            <Plus size={18} aria-hidden />
          </button>

          <label htmlFor={inputId} className="sr-only">
            What did you do?
          </label>
          <input
            id={inputId}
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you do?"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full border border-line bg-paper-raised px-4 py-2.5 text-base outline-none focus:border-line-strong"
          />

          <button
            type="submit"
            disabled={!text.trim() || thinking}
            aria-label="Record this"
            className="shrink-0 rounded-full bg-ink p-2.5 text-paper transition-opacity disabled:opacity-30"
          >
            {thinking ? (
              <Loader2 size={18} aria-hidden className="animate-spin" />
            ) : (
              <ArrowUp size={18} aria-hidden />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
