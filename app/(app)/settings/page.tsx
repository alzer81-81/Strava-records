import Link from "next/link";
import { requireUser } from "../../../lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/" className="rounded-full border border-slateish/20 px-4 py-2 text-sm">
          Home
        </Link>
      </div>
      <section className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Account</h2>
        <p className="mt-2 text-sm text-slateish">Plan: {user.plan}</p>
        <form action="/api/auth/strava/start" method="get" className="mt-4">
          <button className="rounded-full bg-ember px-4 py-2 text-white" type="submit">
            Reconnect Strava
          </button>
        </form>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button className="rounded-full border border-slateish/20 px-4 py-2 text-sm" type="submit">
            Log out
          </button>
        </form>
      </section>
    </div>
  );
}
