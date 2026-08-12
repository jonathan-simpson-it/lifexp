"use client";

/**
 * Error boundary for the signed-in app.
 *
 * Its main job is the local-development trap: `prisma dev` runs the database in
 * a separate terminal, and when that terminal is closed every page fails with a
 * connection error that says nothing about how to fix it. Recognising that case
 * and printing the two commands is worth more than a generic apology.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = `${error.message} ${error.digest ?? ""}`;
  const looksLikeDatabase =
    /ECONNREFUSED|connect|DATABASE_URL|prisma|P1001|P1000|pool/i.test(message);

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="display text-2xl font-semibold">
        {looksLikeDatabase ? "The database isn’t reachable" : "Something broke"}
      </h1>

      {looksLikeDatabase ? (
        <>
          <p className="mt-3 text-ink-soft">
            LifeXP uses a local Postgres in development, started in its own
            terminal. If that window was closed, start it again:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-paper-raised p-3 text-sm">
            npm run db:start
          </pre>
          <p className="mt-3 text-sm text-muted">
            It prints two connection strings. If the port differs from the one in
            your <code>.env</code>, paste the new values in and restart{" "}
            <code>npm run dev</code>. Then, if the data is gone:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-paper-raised p-3 text-sm">
            npx prisma migrate dev{"\n"}npm run seed
          </pre>
        </>
      ) : (
        <p className="mt-3 text-ink-soft">
          Nothing you recorded is affected — this is a display failure, not a
          data one.
        </p>
      )}

      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
      >
        Try again
      </button>

      <details className="mt-5">
        <summary className="cursor-pointer text-sm text-muted">
          Technical detail
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-paper-raised p-3 text-xs text-muted">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
      </details>
    </div>
  );
}
