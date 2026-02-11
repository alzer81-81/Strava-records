export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sand px-6 py-16">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-card">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slateish">Strava Records</p>
          <h1 className="text-3xl font-semibold text-ink">Privacy Policy</h1>
          <p className="text-sm text-slateish">Last updated: February 11, 2026</p>
        </header>
        <div className="space-y-6 text-sm text-slateish">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Overview</h2>
            <p>
              Strava Records is a personal analytics dashboard for your Strava activities. We only
              collect and store the minimum data required to compute your stats and records.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Information We Collect</h2>
            <p>
              When you connect Strava, we store your Strava athlete ID, access tokens, and activity
              fields used to calculate totals and records. This includes distance, moving time,
              elevation gain, timestamps, activity type, and optional metadata such as map polylines.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">How We Use Information</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Compute totals and performance records for your selected timeframes.</li>
              <li>Display activity summaries and route previews in your dashboard.</li>
              <li>Keep your dashboard up to date when you sync.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Sharing and Disclosure</h2>
            <p>
              We do not sell your data. We do not share your data with third parties except as
              necessary to operate the service (for example, using Strava’s API).
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Data Retention</h2>
            <p>
              We keep your data while your account is connected so we can provide the dashboard. You
              can disconnect Strava at any time from Settings, which stops future syncs. If you want
              your data deleted, contact us and we will remove it.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Security</h2>
            <p>
              We take reasonable steps to protect your data. No system is 100% secure, but we aim to
              minimize risk and store only what is necessary.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Contact</h2>
            <p>Questions about this policy? Contact the app owner.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
