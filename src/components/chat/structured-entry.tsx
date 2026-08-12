"use client";

import { useState, useTransition } from "react";
import { createExperience } from "@/app/actions/experiences";

/** Today in the browser's timezone, as YYYY-MM-DD. */
function todayLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Method B from the PRD: title, duration, skill, notes.
 *
 * Kept as a peer of chat rather than a fallback for it. Typing "45" into a
 * duration box is genuinely faster than composing a sentence, and some people
 * simply prefer forms.
 */
export function StructuredEntry({
  skills,
  onDone,
  onCancel,
  preselectedSkillId,
  defaultDate,
}: {
  skills: { id: string; name: string }[];
  onDone: () => void;
  onCancel: () => void;
  /** Carried over when the user picked a chip then chose "another amount". */
  preselectedSkillId?: string;
  /** Set when adding to a specific day from the calendar. */
  defaultDate?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [occurredAt, setOccurredAt] = useState(defaultDate ?? todayLocal());
  const [selected, setSelected] = useState<string[]>(
    preselectedSkillId ? [preselectedSkillId] : [],
  );
  const [newSkill, setNewSkill] = useState("");
  const [notes, setNotes] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give it a title.");
      return;
    }
    if (selected.length === 0 && !newSkill.trim()) {
      setError("Pick a skill, or name a new one.");
      return;
    }

    startTransition(async () => {
      try {
        await createExperience({
          title,
          notes: notes || null,
          occurredAt,
          minutes: hours ? Math.round(Number(hours) * 60) : null,
          skillIds: selected,
          skillNames: newSkill.trim() ? [newSkill.trim()] : [],
          source: "FORM",
        });
        onDone();
      } catch {
        setError("Couldn't save that. Try again?");
      }
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What did you do?"
        className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
            Hours
          </span>
          <input
            type="number"
            step="0.25"
            min="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="optional"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
            When
          </span>
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div>
        <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
          Skills
        </span>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => {
            const active = selected.includes(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() =>
                  setSelected((prev) =>
                    active ? prev.filter((id) => id !== skill.id) : [...prev, skill.id],
                  )
                }
                className={[
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "border-growth/50 bg-growth-soft text-growth"
                    : "border-line text-muted hover:bg-line/40",
                ].join(" ")}
              >
                {skill.name}
              </button>
            );
          })}
        </div>
        <input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="or name a new skill"
          className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
        />
      </div>

      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm"
      />

      {error && (
        <p className="text-sm text-muted" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:bg-line/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
