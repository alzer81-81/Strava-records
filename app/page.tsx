import { prisma } from "../lib/db";
import { readSessionCookie } from "../lib/session";
import { AppShell } from "../components/AppShell";
import { LandingHero } from "../components/LandingHero";
import { RecordsView } from "../components/RecordsView";

export default async function LandingPage({
  searchParams
}: {
  searchParams: { window?: string };
}) {
  const session = readSessionCookie();
  if (!session) return <LandingHero />;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return <LandingHero />;

  return (
    <AppShell>
      <RecordsView userId={user.id} windowParam={searchParams.window} />
    </AppShell>
  );
}
