"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ExperienceDraft } from "@/lib/ai/types";

export type DraftState = ExperienceDraft & { localId: string };

/**
 * The confirm card.
 *
 * Nothing reaches the database until the user presses Save here. Below 0.6
 * confidence the card opens already expanded, because at that point the
 * extractor is guessing and the honest thing is to show the guess rather than
 * present it as a finding.
 */
export function DraftCard({
  draft,
  knownSkills,
  onSave,
  onDismiss,
  saving,
}: {
  draft: DraftState;
  knownSkills: { id: string; name: string }[];
  onSave: (draft: DraftState) => void;
  onDismiss: (localId: string) => void;
  saving: boolean;
}) {
  const uncertain = draft.confidence < 0.6 || draft.skills.length === 0;
  const [expanded, setExpanded] = useState(uncertain);
  const [edited, setEdited] = useState<DraftState>(draft);

  const hoursValue =
    edited.minutes === null ? "" : String(Number((edited.minutes / 60).toFixed(2)));

  function toggleSkill(name: string) {
    setEdited((prev) => ({
      ...prev,
      skills: prev.skills.includes(name)
        ? prev.skills.filter((s) => s !== name)
        : [...prev.skills, name],
    }));
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{edited.title}</p>
          <p className="mt-0.5 text-sm text-muted">
            {edited.minutes !== null
              ? `${Number((edited.minutes / 60).toFixed(2))}h · `
              : "no duration · "}
            {edited.occurredAt}
            {edited.skills.length > 0 ? ` · ${edited.skills.join(", ")}` : ""}
          </p>

          {uncertain && !expanded && (
            <p className="mt-1 text-xs text-muted">
              I wasn&rsquo;t sure about this one, worth a look.
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => onDismiss(draft.localId)}
            aria-label="Discard this draft"
            className="rounded-full border border-line p-2 text-muted transition-colors hover:bg-line/50"
          >
            <X size={15} aria-hidden />
          </button>
          <button
            type="button"
            disabled={saving || edited.skills.length === 0}
            onClick={() => onSave(edited)}
            className="rounded-full border border-growth/40 bg-growth-soft px-3 py-2 text-sm font-medium text-growth transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            <span className="flex items-center gap-1.5">
              <Check size={15} aria-hidden />
              Save
            </span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full border-t border-line px-3 py-1.5 text-left text-xs text-muted hover:bg-line/30"
      >
        {expanded ? "Hide details" : "Edit details"}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-line p-3">
          <Field label="What">
            <input
              value={edited.title}
              onChange={(e) => setEdited((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Hours">
              <input
                type="number"
                step="0.25"
                min="0"
                placeholder="-"
                value={hoursValue}
                onChange={(e) =>
                  setEdited((p) => ({
                    ...p,
                    minutes: e.target.value
                      ? Math.round(Number(e.target.value) * 60)
                      : null,
                  }))
                }
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
              />
            </Field>

            <Field label="When">
              <input
                type="date"
                value={edited.occurredAt}
                onChange={(e) =>
                  setEdited((p) => ({ ...p, occurredAt: e.target.value }))
                }
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Skills">
            <div className="flex flex-wrap gap-1.5">
              {/* Existing skills first, then anything the extractor proposed
                  that isn't one of them yet. */}
              {[
                ...knownSkills.map((s) => s.name),
                ...edited.skills.filter(
                  (name) => !knownSkills.some((s) => s.name === name),
                ),
              ].map((name) => {
                const active = edited.skills.includes(name);
                const isNew = !knownSkills.some((s) => s.name === name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleSkill(name)}
                    className={[
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      active
                        ? "border-growth/50 bg-growth-soft text-growth"
                        : "border-line text-muted hover:bg-line/40",
                    ].join(" ")}
                  >
                    {name}
                    {isNew && active ? " · new" : ""}
                  </button>
                );
              })}
            </div>
            {edited.skills.length === 0 && (
              <p className="mt-1.5 text-xs text-muted">
                Pick at least one skill, or discard this draft.
              </p>
            )}
          </Field>

          <Field label="Notes">
            <textarea
              rows={2}
              value={edited.notes ?? ""}
              onChange={(e) =>
                setEdited((p) => ({ ...p, notes: e.target.value || null }))
              }
              placeholder="Anything worth remembering about it"
              className="w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
