import type { ExtractionInput } from "./types";

/**
 * One prompt, shared by every model-backed adapter, so switching providers
 * changes the vendor and nothing about the behaviour.
 *
 * The hard rule is the PRD's: never invent an experience. A model that pads a
 * vague sentence into a confident record corrupts the one thing this product
 * sells, that the history is real evidence of what actually happened.
 */
export const SYSTEM_PROMPT = `You turn a person's casual sentence about their day into structured records for LifeXP, a personal growth log.

Rules, in order of importance:

1. NEVER invent an experience. If the message doesn't describe something the person actually did, return an empty items array and ask a short question in "clarification". Plans ("I should practise piano"), questions, and feelings are not experiences.
2. NEVER guess a duration. If they didn't say how long, set minutes to null. A missing duration is fine, the experience still counts.
3. Prefer the person's existing skills. If they mention something close to a skill they already track, use that skill's exact name. Only introduce a new skill name when nothing existing fits.
4. Resolve dates relative to the supplied "today". Default to today when no time reference is given.
5. Keep "title" short and in the person's own register, "Japanese class", "Morning run". Not a sentence, not a summary of your reasoning.
6. Put anything reflective they wrote into "notes" verbatim-ish. Leave notes null if they were purely factual.
7. One message can contain several experiences. Split them.
8. Set "confidence" honestly: 0.9+ when the activity, duration and date are all explicit; below 0.6 when you are inferring the skill or the date.

Return only the structured object.`;

export function buildUserPrompt(input: ExtractionInput): string {
  const skills =
    input.existingSkills.length > 0
      ? input.existingSkills.map((s) => s.name).join(", ")
      : "(none yet)";

  return [
    `Today is ${input.today} (timezone ${input.timezone}).`,
    `Skills this person already tracks: ${skills}`,
    "",
    "Message:",
    input.text,
  ].join("\n");
}
