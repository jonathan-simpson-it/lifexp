import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { NavTabs } from "@/components/nav-tabs";
import { AccountMenu } from "@/components/account-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="display text-lg font-semibold tracking-tight">
            LifeXP
          </Link>
          <AccountMenu name={session.user.name ?? session.user.email ?? "You"} />
        </div>
        <NavTabs />
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-32">{children}</main>
    </div>
  );
}
