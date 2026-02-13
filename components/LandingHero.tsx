import { ConnectButton } from "./ConnectButton";
import Image from "next/image";

export function LandingHero() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-20 pt-16">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-8">
            <div className="flex items-center">
              <Image src="/BT_logo.png" alt="Best Times" width={200} height={60} />
            </div>
            <h1 className="font-[var(--font-fraunces)] text-5xl font-black leading-[0.98] text-ink md:text-7xl">
              Run hard.
              <br />
              Track faster.
              <br />
              Keep leveling up.
            </h1>
            <p className="max-w-2xl text-lg text-slate-700 md:text-xl">
              Best Times turns your Strava history into a high-signal dashboard that celebrates progress.
              Clean records. Clear momentum. Zero fluff.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ConnectButton />
              <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-soft">
                Compatible with Strava
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-punch">
              <h2 className="text-lg font-semibold text-ink">Why runners use it</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  "Your fastest moments across every key distance",
                  "Powerful totals by week, month, and longer windows",
                  "Speed, climbs, and long-run highlights in one glance",
                  "Route previews attached to your biggest efforts"
                ].map((item) => (
                  <div key={item} className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-punch">
              <h2 className="text-lg font-semibold text-ink">What it feels like</h2>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-blaze">Zero Noise</p>
                  <p className="mt-2 text-slate-700">No social feed. No distraction. Just effort and outcomes.</p>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-sprint">True Progress</p>
                  <p className="mt-2 text-slate-700">Your records and totals are synced directly from Strava.</p>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-[0.2em] text-moss">Private by Default</p>
                  <p className="mt-2 text-slate-700">Your data stays yours. Nothing public unless you choose.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold text-ink">How it works</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ["Step 1", "Connect with Strava using secure OAuth."],
              ["Step 2", "We sync activities and calculate your strongest efforts."],
              ["Step 3", "Open your dashboard and keep your momentum visible."]
            ].map(([title, body]) => (
              <div key={title}>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{body}</p>
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
