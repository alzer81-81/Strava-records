import { ConnectButton } from "./ConnectButton";
import Image from "next/image";

export function LandingHero() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="relative mx-auto flex max-w-6xl flex-col gap-10 overflow-hidden px-6 pb-20 pt-16">
        <div className="pointer-events-none absolute left-[28%] right-[-34%] top-[260px] z-0 hidden md:block">
          <Image
            src="/orange_bar.svg"
            alt=""
            width={1156}
            height={237}
            priority
            className="h-auto w-full opacity-95"
          />
        </div>

        <div className="relative z-10 flex flex-col gap-10">
          <div className="flex flex-col gap-8">
            <div className="flex items-center">
              <Image src="/BT_logo.png" alt="Best Times" width={200} height={60} />
            </div>
            <h1 className="font-[var(--font-fraunces)] text-5xl font-black leading-[0.95] text-ink md:text-8xl">
              Train with intent.
              <br />
              See what is real.
            </h1>
            <p className="max-w-3xl text-lg text-slate-700 md:text-2xl">
              Best Times turns your Strava history into a high-signal performance dashboard. You get accurate
              records, clean totals, and route context without noise.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ConnectButton />
              <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-soft">
                Compatible with Strava
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "PB Board",
                body: "Track best efforts across key race distances.",
                icon: <BoltIcon />
              },
              {
                title: "All-Time Sync",
                body: "Pull full activity history when you need deep records.",
                icon: <RefreshIcon />
              },
              {
                title: "Timeframe Views",
                body: "Switch week, month, 2M, 6M, year, and all-time.",
                icon: <CalendarIcon />
              },
              {
                title: "Route Context",
                body: "See map previews beside major efforts and records.",
                icon: <MapIcon />
              }
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black text-ink">{item.title}</h3>
                <p className="mt-2 text-sm font-medium text-slate-700">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-punch">
              <h2 className="font-[var(--font-fraunces)] text-4xl font-black text-ink md:text-5xl">Why runners use it</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Fastest moments",
                    body: "Your best efforts across every key distance.",
                    icon: <BoltIcon />
                  },
                  {
                    title: "Serious totals",
                    body: "Week, month, and long-window performance in one place.",
                    icon: <ChartIcon />
                  },
                  {
                    title: "Strength signals",
                    body: "Speed, climbs, and long-run highlights at a glance.",
                    icon: <MountainIcon />
                  },
                  {
                    title: "Route context",
                    body: "Map previews attached to your biggest sessions.",
                    icon: <MapIcon />
                  }
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-black/10 bg-white px-4 py-4 shadow-soft">
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      {item.icon}
                    </div>
                    <p className="text-lg font-black text-ink">{item.title}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-punch">
              <h2 className="font-[var(--font-fraunces)] text-4xl font-black text-ink md:text-5xl">What it feels like</h2>
              <ul className="mt-5 space-y-4 text-sm text-slate-600">
                <li className="rounded-lg border border-black/10 p-4">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-blaze">
                    <NoiseIcon />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-blaze">Zero Noise</p>
                  <p className="mt-2 text-slate-700">No social feed. No distraction. Just effort and outcomes.</p>
                </li>
                <li className="rounded-lg border border-black/10 p-4">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sprint">
                    <ProgressIcon />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sprint">True Progress</p>
                  <p className="mt-2 text-slate-700">Your records and totals are synced directly from Strava.</p>
                </li>
                <li className="rounded-lg border border-black/10 p-4">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-moss">
                    <LockIcon />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-moss">Private by Default</p>
                  <p className="mt-2 text-slate-700">Your data stays yours. Nothing public unless you choose.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-card">
          <h3 className="font-[var(--font-fraunces)] text-4xl font-black text-ink md:text-5xl">How it works</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ["Step 1", "Connect with Strava using secure OAuth."],
              ["Step 2", "We sync activities and calculate your strongest efforts."],
              ["Step 3", "Open your dashboard and keep your momentum visible."]
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-black/10 bg-white p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                  {title.split(" ")[1]}
                </div>
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

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 20l6-10 4 6 3-4 5 8H3z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

function NoiseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M7 8h10M9 16h6" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20h16" />
      <path d="M6 16l4-5 3 3 5-7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 10-3.2 6.9" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}
