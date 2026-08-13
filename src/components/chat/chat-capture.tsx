"use client";

import { useState, useTransition } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { createExperience } from "@/app/actions/experiences";
import type { ExperienceDraft } from "@/lib/ai/types";
import { DraftCard, type DraftState } from "./draft-card";
import type { LogResult } from "@/components/log/log-sheet";

/**
 * Conversational capture, extracted from the old pinned chat bar so it can live
 * inside the log sheet.
 *
 * The contract is unchanged and non-negotiable: this asks the server to
 * *extract* drafts and writes nothing until the user presses Save on a card.
 */
export function ChatCapture({
  skills,
  onSaved,
  onBack,
}: {
  skills: { id: string; name: string }[];
  onSaved: (result: LogResult) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [drafts, setDrafts] = useState<DraftState[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [knownSkills, setKnownSkills] = useState(skills);
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
        setMessage(data.error ?? "That didn't work. Try adding it by hand.");
        return;
      }

      const items: ExperienceDraft[] = data.items ?? [];
      setDrafts(
        items.map((item, index) => ({ ...item, localId: `${Date.now()}-${index}` })),
      );
      if (Array.isArray(data.knownSkills)) setKnownSkills(data.knownSkills);

      setMessage(
        data.clarification ??
          (items.length === 0 ? "I couldn't find an experience in that." : null),
      );
    } catch {
      setMessage("Couldn't reach the server. Your text is still here.");
    } finally {
      setThinking(false);
    }
  }

  function saveDraft(draft: DraftState) {
    startSaving(async () => {
      try {
        const { progress, moment } = await createExperience({
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
        onSaved({
          newBadgeKeys: progress.newBadgeKeys,
          newMilestoneIds: progress.newMilestoneIds,
          skillName: draft.skills[0] ?? draft.title,
          minutes: draft.minutes,
          moment,
        });
      } catch {
        setMessage("Couldn't save that one. Try again?");
      }
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="flex items-center gap-2">
        <label htmlFor="chat-capture" className="sr-only">
          What did you do?
        </label>
        <input
          id="chat-capture"
          autoFocus
          // The mobile return key says "Send" rather than "Go", and the field
          // is free prose, so autocorrect helps and autocapitalise is right.
          enterKeyHint="send"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Went to Japanese class for 90 minutes today"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-base outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!text.trim() || thinking}
          aria-label="Record this"
          // accent-deep, not accent: white on the lighter sage is 3.09:1, and
          // this glyph is the only thing telling you the button is the submit.
          className="tappable shrink-0 rounded-full bg-accent-deep p-2.5 text-white disabled:opacity-30"
        >
          {thinking ? (
            <Loader2 size={18} aria-hidden className="animate-spin" />
          ) : (
            <ArrowUp size={18} aria-hidden />
          )}
        </button>
      </form>

      {message && (
        <p className="mt-2 text-sm text-muted" role="status">
          {message}
        </p>
      )}

      {drafts.length > 0 && (
        <div className="mt-3 space-y-2">
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

      <button
        type="button"
        onClick={onBack}
        className="tappable mt-3 w-full rounded-xl py-2 text-sm text-muted hover:text-ink"
      >
        Back
      </button>
    </div>
  );
}
