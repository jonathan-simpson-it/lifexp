import { redirect } from "next/navigation";
import { currentUserId, signIn, hasGoogleCredentials } from "@/lib/auth";

export const metadata = { title: "Sign in · LifeXP" };

export default async function SignInPage() {
  // currentUserId, not auth(): a session pointing at a deleted user must land
  // here and be offered a fresh sign-in, otherwise this page and the app layout
  // redirect to each other indefinitely.
  const userId = await currentUserId();
  if (userId) redirect("/today");

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/today" });
  }

  async function signInForDevelopment(formData: FormData) {
    "use server";
    await signIn("dev", {
      email: String(formData.get("email") ?? "demo@lifexp.local"),
      redirectTo: "/today",
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <h1 className="display text-4xl leading-tight font-semibold">LifeXP</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Some of the most valuable things in life only pay off over months or
        years. LifeXP keeps the evidence, so the progress is visible while
        you&rsquo;re still in the middle of it.
      </p>
      <p className="mt-3 text-sm text-muted">
        No streaks. No reminders nagging you. A slow month still counts.
      </p>

      <div className="mt-10">
        {hasGoogleCredentials ? (
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full rounded-full bg-ink px-5 py-3 text-base font-medium text-paper transition-opacity hover:opacity-90"
            >
              Continue with Google
            </button>
          </form>
        ) : (
          <form action={signInForDevelopment} className="space-y-3">
            <label htmlFor="email" className="block text-sm text-muted">
              Development sign-in
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="demo@lifexp.local"
              className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-base"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-ink px-5 py-3 text-base font-medium text-paper transition-opacity hover:opacity-90"
            >
              Continue
            </button>
            <p className="text-xs text-muted">
              Google credentials aren&rsquo;t configured, so LifeXP is offering a
              local sign-in instead. Set <code>AUTH_GOOGLE_ID</code> and{" "}
              <code>AUTH_GOOGLE_SECRET</code> to switch to Google.
            </p>
          </form>
        )}
      </div>

      {!hasGoogleCredentials && (
        <div className="mt-8 rounded-xl border border-line p-4">
          <p className="text-sm font-medium">Everything works without any keys</p>
          <p className="mt-1.5 text-sm text-muted">
            Continue as <code>demo@lifexp.local</code> for two years of example
            history — a skill deep into its ladder, medals earned and still to
            find, and maintenance at every stage of freshness.
          </p>
          <ul className="mt-2.5 space-y-1 text-sm text-muted">
            <li>
              <strong className="font-medium text-ink-soft">Chat</strong> runs on a
              built-in extractor — no API key, no network.
            </li>
            <li>
              <strong className="font-medium text-ink-soft">Calendar</strong> shows
              exactly what it would write to Google, in Settings.
            </li>
            <li>
              Any other email starts an <strong className="font-medium text-ink-soft">
                empty account
              </strong>{" "}
              if you&rsquo;d rather see it from scratch.
            </li>
          </ul>
        </div>
      )}

      <p className="mt-8 text-xs text-muted">
        Signing in with Google does not give LifeXP access to your calendar.
        That&rsquo;s a separate choice you can make later, in Settings.
      </p>
    </main>
  );
}
