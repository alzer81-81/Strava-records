import { ConnectButton } from "./ConnectButton";

export function LandingHero() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sand via-white to-[#ffe8d2]">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slateish">Strava Records</p>
            <h1 className="mt-4 font-[var(--font-fraunces)] text-4xl font-semibold leading-tight text-ink md:text-6xl">
              Your training, distilled into true personal records.
            </h1>
            <p className="mt-4 text-lg text-slateish">
              Connect Strava once and get a clean, focused dashboard of totals, all‑time PRs, and
              record‑setting runs—without clutter.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ConnectButton />
              <span className="text-sm text-slateish">Free to use while in beta.</span>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold">What you get</h2>
            <ul className="mt-4 grid gap-3 text-sm text-slateish">
              <li className="rounded-2xl bg-sand/60 px-4 py-3">All‑time PRs computed from activity streams</li>
              <li className="rounded-2xl bg-sand/60 px-4 py-3">Totals by week, month, and year windows</li>
              <li className="rounded-2xl bg-sand/60 px-4 py-3">Fastest average speed, biggest climb, and longest run</li>
              <li className="rounded-2xl bg-sand/60 px-4 py-3">Route previews for key efforts</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold">Built for focus</h3>
            <p className="mt-3 text-sm text-slateish">
              No feeds or noise—just the metrics that actually show your progress.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold">Accurate PRs</h3>
            <p className="mt-3 text-sm text-slateish">
              We compute best efforts from streams for precise results across distances.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold">Private by default</h3>
            <p className="mt-3 text-sm text-slateish">
              Your data stays in your account. Nothing is shared without your consent.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-sand bg-white/70 p-6 shadow-card">
          <h3 className="text-lg font-semibold">How it works</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slateish">Step 1</p>
              <p className="mt-2 text-sm text-slateish">Connect Strava with secure OAuth.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slateish">Step 2</p>
              <p className="mt-2 text-sm text-slateish">We sync your activities and compute records.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slateish">Step 3</p>
              <p className="mt-2 text-sm text-slateish">Open your dashboard to see updated totals and PRs.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
