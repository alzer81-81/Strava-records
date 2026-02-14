import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-sand px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-[var(--font-fraunces)] text-4xl font-semibold">Strava Records Pro</h1>
        <p className="mt-4 text-slateish">Unlock full history, leaderboards, and premium insights.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-sand bg-white p-6 shadow-card">
            <h2 className="text-xl font-semibold">Free</h2>
            <ul className="mt-4 list-disc pl-5 text-sm text-slateish">
              <li>Weekly, monthly, and last 2 months</li>
              <li>5K + 10K records</li>
              <li>1 group with up to 5 members</li>
            </ul>
          </div>
          <div className="rounded-lg bg-ember p-6 text-white shadow-card">
            <h2 className="text-xl font-semibold">Pro</h2>
            <ul className="mt-4 list-disc pl-5 text-sm">
              <li>Last 6 months and year views</li>
              <li>Full distance records</li>
              <li>Multiple groups and larger member caps</li>
              <li>CSV exports (soon)</li>
            </ul>
            <div className="mt-6">
              <span className="text-sm opacity-80">Coming soon</span>
            </div>
          </div>
        </div>
        <div className="mt-10">
          <Link href="/" className="text-ember">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
