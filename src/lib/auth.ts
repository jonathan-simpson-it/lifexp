import NextAuth from "next-auth";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { DEMO_EMAIL, DEMO_USER_ID, isDemoMode } from "@/lib/demo";

/**
 * `ui-test-only`: with no database there is nothing to authenticate against, so
 * the whole NextAuth stack is swapped for a stub that always answers with the
 * demo user. Reads are answered from fixtures (lib/demo.ts) and writes are
 * accepted but never persisted (see the server actions).
 */
export const demoMode = isDemoMode();

/**
 * Google sign-in is the primary path. The calendar write-back needs a Google
 * account anyway, so asking for a second identity would be pointless friction.
 *
 * We deliberately request ONLY the default identity scopes here. Calendar
 * access is a separate, later consent triggered from Settings (see
 * `CALENDAR_SCOPE` below), so someone who never wants LifeXP near their
 * calendar is never confronted with that permission just to sign in.
 */
export const hasGoogleCredentials = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/**
 * The narrowest calendar scope that exists: it grants access only to secondary
 * calendars this app itself created. Even fully granted, LifeXP cannot read or
 * modify the user's existing calendars.
 *
 * Requested lazily from Settings, never at sign-in.
 */
export const CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created";

const providers: NextAuthConfig["providers"] = [];

if (hasGoogleCredentials) {
  providers.push(
    Google({
      authorization: {
        params: {
          // Needed for a refresh token, which the calendar sync relies on to
          // keep working after the access token expires an hour later.
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile",
        },
      },
    }),
  );
}

/**
 * Development-only escape hatch. Without it, nobody can open the app until a
 * Google Cloud project exists, which would block all UI work and every demo on
 * an OAuth consent screen. Never registered in production.
 */
if (!hasGoogleCredentials && process.env.NODE_ENV !== "production") {
  providers.push(
    Credentials({
      id: "dev",
      name: "Development sign-in",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" && credentials.email.trim()
            ? credentials.email.trim().toLowerCase()
            : DEMO_EMAIL;

        const user = await db.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split("@")[0] },
        });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  );
}

const nextAuth = demoMode
  ? null
  : NextAuth({
      adapter: PrismaAdapter(db),
      providers,
      // JWT sessions, not database sessions: the Credentials provider above only
      // works with this strategy. The adapter still persists User and Account
      // rows on Google sign-in, which is what the calendar integration reads its
      // refresh token from.
      session: { strategy: "jwt" },
      pages: { signIn: "/signin" },
      callbacks: {
        jwt({ token, user }) {
          if (user?.id) token.userId = user.id;
          return token;
        },
        session({ session, token }) {
          if (token.userId && session.user) {
            session.user.id = token.userId as string;
          }
          return session;
        },
      },
    });

type RealAuth = NonNullable<typeof nextAuth>;

/**
 * Reading headers opts every route that asks for a session into dynamic
 * rendering, so the demo's "this week" is computed per request rather than
 * frozen at build time. The session object mirrors what NextAuth returns.
 */
async function demoSession() {
  await headers();
  return {
    user: { id: DEMO_USER_ID, email: DEMO_EMAIL, name: "Demo" },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  };
}

async function demoSignIn(): Promise<void> {
  redirect("/today");
}

async function demoSignOut(): Promise<void> {
  redirect("/");
}

const demoHandlers = {
  GET: async () => new Response("Not available in demo mode", { status: 404 }),
  POST: async () => new Response("Not available in demo mode", { status: 404 }),
};

export const handlers: RealAuth["handlers"] = nextAuth
  ? nextAuth.handlers
  : (demoHandlers as unknown as RealAuth["handlers"]);

export const auth: RealAuth["auth"] = nextAuth
  ? nextAuth.auth
  : (demoSession as unknown as RealAuth["auth"]);

export const signIn: RealAuth["signIn"] = nextAuth
  ? nextAuth.signIn
  : (demoSignIn as unknown as RealAuth["signIn"]);

export const signOut: RealAuth["signOut"] = nextAuth
  ? nextAuth.signOut
  : (demoSignOut as unknown as RealAuth["signOut"]);

/**
 * The signed-in user's id, or null. Every data read is scoped through this.
 *
 * The session is a JWT, so it keeps asserting a user id long after that user
 * has been deleted, the token is cryptographically valid and there is nothing
 * in it to invalidate. The failure mode is nasty and quiet: reads scoped to a
 * missing user return empty rather than erroring, so pages render fine and look
 * merely empty, and the first sign of trouble is a foreign-key violation on the
 * next write.
 *
 * So the id is confirmed against the database before it is trusted. `cache`
 * dedupes that lookup across the layout, the page and any server action in the
 * same request, making it one query rather than one per caller.
 */
export const currentUserId = cache(async (): Promise<string | null> => {
  if (demoMode) return DEMO_USER_ID;

  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true },
  });

  return user?.id ?? null;
});

/**
 * For server actions and pages that cannot function without a user. Server
 * actions are reachable by direct POST, so authorisation is re-checked inside
 * each one rather than trusted from the page that rendered the form.
 *
 * Redirects rather than throwing. Being signed out is an ordinary state, not an
 * error, and throwing filled the dev server's log with a stack trace every time
 * someone opened the app in a fresh browser. `redirect` throws a control-flow
 * signal Next handles, so callers still get a non-null id or nothing at all.
 */
export async function requireUserId(): Promise<string> {
  const userId = await currentUserId();
  if (!userId) redirect("/signin");
  return userId;
}
