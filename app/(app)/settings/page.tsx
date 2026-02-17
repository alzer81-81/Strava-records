import { cookies } from "next/headers";
import { requireUser } from "../../../lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();
  const store = cookies();
  const savedUnit = store.get("bt_distance_unit")?.value === "mi" ? "mi" : "km";

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg bg-white p-6 shadow-card">
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

      <section className="rounded-lg bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Preferences</h2>

        <form action="/api/preferences" method="post" className="mt-4 grid gap-4 md:max-w-md">
          <input type="hidden" name="redirectTo" value="/settings" />
          <div>
            <label htmlFor="distanceUnit" className="mb-1 block text-sm font-medium text-slateish">
              Distance Unit
            </label>
            <select
              id="distanceUnit"
              name="distanceUnit"
              defaultValue={savedUnit}
              className="w-full rounded-md border border-slateish/20 bg-white px-3 py-2 text-sm"
            >
              <option value="km">Kilometers (km)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </div>
          <button className="rounded-full bg-ember px-4 py-2 text-white" type="submit">
            Save Preferences
          </button>
        </form>
      </section>
    </div>
  );
}
