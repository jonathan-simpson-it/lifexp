import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractExperiences } from "@/lib/ai/provider";

/**
 * Chat extraction.
 *
 * This endpoint READS ONLY. It returns drafts for the user to confirm and
 * writes nothing to the Experience table — "human first, AI assists" is
 * enforced here, at the boundary, rather than left to the UI to honour.
 */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let text: string;
  try {
    const body = (await request.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Say something first" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json(
      { error: "That's longer than this box is meant for — try one thing at a time." },
      { status: 400 },
    );
  }

  const [user, skills] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
    db.skill.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  const timezone = user?.timezone || "UTC";

  // "Today" has to be computed in the user's timezone, or someone logging at
  // 11pm gets tomorrow's date attached to their evening.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  try {
    const result = await extractExperiences({
      text,
      today,
      timezone,
      existingSkills: skills,
    });

    return NextResponse.json({
      items: result.items,
      clarification: result.clarification ?? null,
      providerName: result.providerName,
      degraded: result.degraded,
      knownSkills: skills,
    });
  } catch (error) {
    console.error("[lifexp] extraction failed:", error);
    return NextResponse.json(
      {
        error:
          "I couldn't read that just now. You can still add it with the form below.",
      },
      { status: 502 },
    );
  }
}
