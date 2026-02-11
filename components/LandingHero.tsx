import { ConnectButton } from "./ConnectButton";

export function LandingHero() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sand via-white to-[#ffe8d2]">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.4em] text-slateish">Strava Records</p>
          <h1 className="mt-4 font-[var(--font-fraunces)] text-4xl font-semibold leading-tight text-ink md:text-6xl">
            Your best efforts, beautifully ranked.
          </h1>
          <p className="mt-4 text-lg text-slateish">
            Track weekly wins, compare your fastest 5K, and build private performance dashboards with ease.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ConnectButton />
            <a
              href="/pricing"
              className="rounded-full border border-slateish/20 px-6 py-3 text-slateish transition hover:border-slateish/40"
            >
              See Pro
            </a>
          </div>
        </div>
        <div className="flex-1">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slateish">This week</p>
                <p className="text-2xl font-semibold">28.4 km</p>
              </div>
              <span className="rounded-full bg-ember/10 px-3 py-1 text-xs text-ember">Rolling 7 days</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-sand px-4 py-3">
                <p className="text-xs uppercase text-slateish">Fastest 5K</p>
                <p className="mt-2 text-lg font-semibold">22:18</p>
              </div>
              <div className="rounded-2xl bg-sand px-4 py-3">
                <p className="text-xs uppercase text-slateish">Longest Run</p>
                <p className="mt-2 text-lg font-semibold">18.2 km</p>
              </div>
            </div>
            <div className="mt-6 h-32 rounded-2xl bg-gradient-to-r from-ember/20 via-amber-200/40 to-white" />
          </div>
        </div>
      </section>
    </main>
  );
}
