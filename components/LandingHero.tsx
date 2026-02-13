import { ConnectButton } from "./ConnectButton";
import Image from "next/image";

export function LandingHero() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-20 pt-16">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Image src="/BT_logo.png" alt="Best Times" width={44} height={44} />
              <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Best Times</p>
            </div>
            <h1 className="font-[var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-ink md:text-7xl">
              The cleanest way to see your fastest efforts.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 md:text-xl">
              One connect. A single dashboard. Every personal record that matters—clearly ranked,
              beautifully displayed, and always in sync.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ConnectButton />
              <span className="text-sm text-slate-500">No subscription. No noise. Just your best.</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-black/10 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold">What you get</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  "All-time PRs computed from activity streams",
                  "Totals by week, month, and year windows",
                  "Fastest average speed, biggest climb, longest run",
                  "Route previews for key efforts"
                ].map((item) => (
                  <div key={item} className="rounded-lg border border-black/10 px-4 py-3 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold">Why it hits</h2>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Designed for focus</p>
                  <p className="mt-2">No feeds or clutter. Just the signals that show progress.</p>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Accurate PRs</p>
                  <p className="mt-2">Best efforts calculated from streams for real results.</p>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Private by default</p>
                  <p className="mt-2">Your data stays in your account. Nothing shared without you.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold">How it works</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ["Step 1", "Connect Strava with secure OAuth."],
              ["Step 2", "We sync your activities and compute records."],
              ["Step 3", "Open your dashboard to see totals and PRs."]
            ].map(([title, body]) => (
              <div key={title}>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
                <p className="mt-2 text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center">
            <Image
              src="/powered_by_strava.png"
              alt="Powered by Strava"
              width={180}
              height={48}
            />
          </div>
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
