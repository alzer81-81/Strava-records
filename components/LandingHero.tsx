import { ConnectButton } from "./ConnectButton";

export function LandingHero() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffe8d2_0%,_#fff7ee_45%,_#f6efe6_100%)]">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-20 pt-16">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <p className="text-xs uppercase tracking-[0.5em] text-slateish">Strava Records</p>
            <h1 className="font-[var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-ink md:text-7xl">
              The cleanest way to see your fastest efforts.
            </h1>
            <p className="max-w-2xl text-lg text-slateish md:text-xl">
              One connect. A single dashboard. Every personal record that matters—clearly ranked,
              beautifully displayed, and always in sync.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ConnectButton />
              <span className="text-sm text-slateish">No subscription. No noise. Just your best.</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl bg-white/90 p-6 shadow-card">
              <h2 className="text-lg font-semibold">What you get</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  "All-time PRs computed from activity streams",
                  "Totals by week, month, and year windows",
                  "Fastest average speed, biggest climb, longest run",
                  "Route previews for key efforts"
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-sand/60 px-4 py-3 text-sm text-slateish">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-sand bg-white/80 p-6 shadow-card">
              <h2 className="text-lg font-semibold">Why it hits</h2>
              <ul className="mt-4 space-y-4 text-sm text-slateish">
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-slateish">Designed for focus</p>
                  <p className="mt-2">No feeds or clutter. Just the signals that show progress.</p>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-slateish">Accurate PRs</p>
                  <p className="mt-2">Best efforts calculated from streams for real results.</p>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-slateish">Private by default</p>
                  <p className="mt-2">Your data stays in your account. Nothing shared without you.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sand bg-white/80 p-6 shadow-card">
          <h3 className="text-lg font-semibold">How it works</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ["Step 1", "Connect Strava with secure OAuth."],
              ["Step 2", "We sync your activities and compute records."],
              ["Step 3", "Open your dashboard to see totals and PRs."]
            ].map(([title, body]) => (
              <div key={title}>
                <p className="text-xs uppercase tracking-[0.2em] text-slateish">{title}</p>
                <p className="mt-2 text-sm text-slateish">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slateish">
          <a href="/privacy" className="underline decoration-slateish/30 underline-offset-4">
            Privacy Policy
          </a>
          <a href="/terms" className="underline decoration-slateish/30 underline-offset-4">
            Terms of Service
          </a>
        </div>
      </section>
    </main>
  );
}
