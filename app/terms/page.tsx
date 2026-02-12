export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sand px-6 py-16">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 rounded-lg bg-white p-8 shadow-card">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slateish">Best Times</p>
          <h1 className="text-3xl font-semibold text-ink">Terms of Service</h1>
          <p className="text-sm text-slateish">Last updated: February 11, 2026</p>
        </header>
        <div className="space-y-6 text-sm text-slateish">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Acceptance of Terms</h2>
            <p>
              By using Strava Records, you agree to these Terms of Service and to comply with
              Strava’s API terms and policies.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Use of the Service</h2>
            <p>
              You are responsible for your use of the service and for maintaining access to your
              Strava account. You may disconnect at any time from Settings, which stops future
              syncs.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Third-Party Services</h2>
            <p>
              The service relies on Strava’s API. We are not responsible for outages, changes, or
              limitations imposed by Strava.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Disclaimers</h2>
            <p>
              The service is provided “as is” without warranties of any kind. We do not guarantee
              accuracy or availability at all times.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we are not liable for any indirect, incidental,
              or consequential damages arising from use of the service.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Changes to These Terms</h2>
            <p>
              We may update these terms as the product evolves. Continued use of the service after
              changes means you accept the updated terms.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Contact</h2>
            <p>Questions about these terms? Contact the app owner.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
