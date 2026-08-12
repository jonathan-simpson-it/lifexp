"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createExperience } from "@/app/actions/experiences";
import type { QuickSkill } from "@/lib/growth/aggregate";
import { SkillIcon } from "@/components/icons";
import { skillColor } from "@/lib/ui/format";
import { ChatCapture } from "@/components/chat/chat-capture";
import { StructuredEntry } from "@/components/chat/structured-entry";

export type LogResult = {
  newBadgeKeys: string[];
  newMilestoneIds: string[];
  skillName: string;
  minutes: number | null;
};

/**
 * The quick-log sheet behind the centre button.
 *
 * The whole product rests on this being fast. Tapping a skill chip and then a
 * duration logs the thing in two taps and closes — no confirmation screen, no
 * date picker, no scrolling. Chat and the full form stay one tap deeper for the
 * cases the presets cannot express.
 */

const PRESETS = [15, 30, 45, 60, 90, 120];

type Mode = "quick" | "chat" | "form";

export function LogSheet({
  open,
  onClose,
  skills,
  onLogged,
}: {
  open: boolean;
  onClose: () => void;
  skills: QuickSkill[];
  onLogged: (result: LogResult) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("quick");
  const [picked, setPicked] = useState<QuickSkill | null>(null);
  const [saving, startSaving] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset every time it opens: the sheet should never remember a half-finished
  // interaction from an hour ago.
  useEffect(() => {
    if (open) {
      setMode("quick");
      setPicked(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function logQuick(skill: QuickSkill, minutes: number) {
    startSaving(async () => {
      const { progress } = await createExperience({
        title: skill.name,
        occurredAt: new Date().toISOString(),
        minutes,
        skillIds: [skill.id],
        source: "FORM",
      });

      onLogged({
        newBadgeKeys: progress.newBadgeKeys,
        newMilestoneIds: progress.newMilestoneIds,
        skillName: skill.name,
        minutes,
      });
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Record something"
        className="rise-in relative w-full max-w-lg rounded-t-[var(--radius-sheet)] border border-line bg-paper-raised p-4 pb-6 shadow-raised md:rounded-[var(--radius-sheet)]"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong md:hidden" />

        <div className="mb-3 flex items-center justify-between">
          <h2 className="display text-lg font-semibold">
            {mode === "quick"
              ? picked
                ? `How long on ${picked.name}?`
                : "What did you do?"
              : mode === "chat"
                ? "Describe it"
                : "Add detail"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tappable rounded-full p-1.5 text-muted hover:bg-line/50"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {mode === "quick" && (
          <>
            {skills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const active = picked?.id === skill.id;
                  const color = skillColor(skill.colorSeed);
                  return (
                    <li key={skill.id}>
                      <button
                        type="button"
                        onClick={() => setPicked(active ? null : skill)}
                        aria-pressed={active}
                        className={[
                          "tappable flex items-center gap-2 rounded-full border px-3 py-2 text-sm",
                          active
                            ? "border-transparent font-semibold text-white"
                            : "border-line bg-paper hover:bg-line/30",
                        ].join(" ")}
                        style={active ? { background: color } : { color }}
                      >
                        <SkillIcon templateKey={skill.templateKey} size={17} />
                        <span className={active ? "" : "text-ink"}>{skill.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                No skills yet — describe what you did and one will be created.
              </p>
            )}

            {/* Durations only appear once a skill is chosen, so the first tap
                is never ambiguous. */}
            {picked && (
              <div className="rise-in mt-4">
                <ul className="grid grid-cols-3 gap-2">
                  {PRESETS.map((minutes) => (
                    <li key={minutes}>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => logQuick(picked, minutes)}
                        className="tappable w-full rounded-xl border border-line bg-paper py-3 text-sm font-medium hover:border-action hover:text-action-deep disabled:opacity-50"
                      >
                        {minutes < 60
                          ? `${minutes}m`
                          : `${Number((minutes / 60).toFixed(1))}h`}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setMode("form")}
                  className="tappable mt-2 w-full rounded-xl py-2 text-sm text-muted hover:text-ink"
                >
                  Another amount, or no duration
                </button>
              </div>
            )}

            <div className="mt-4 flex gap-2 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => setMode("chat")}
                className="tappable flex-1 rounded-xl border border-line py-2.5 text-sm hover:bg-line/30"
              >
                Describe it
              </button>
              <button
                type="button"
                onClick={() => setMode("form")}
                className="tappable flex-1 rounded-xl border border-line py-2.5 text-sm hover:bg-line/30"
              >
                Add detail
              </button>
            </div>
          </>
        )}

        {mode === "chat" && (
          <ChatCapture
            skills={skills.map((s) => ({ id: s.id, name: s.name }))}
            onSaved={(result) => {
              onLogged(result);
              onClose();
              router.refresh();
            }}
            onBack={() => setMode("quick")}
          />
        )}

        {mode === "form" && (
          <StructuredEntry
            skills={skills.map((s) => ({ id: s.id, name: s.name }))}
            preselectedSkillId={picked?.id}
            onDone={() => {
              onClose();
              router.refresh();
            }}
            onCancel={() => setMode("quick")}
          />
        )}
      </div>
    </div>
  );
}
