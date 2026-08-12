import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRecentSkills } from "@/lib/growth/aggregate";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  // Loaded once here rather than per page: the log sheet is reachable from
  // every screen, so its chips must be too.
  const skills = await getRecentSkills(session.user.id);

  return <AppShell skills={skills}>{children}</AppShell>;
}
