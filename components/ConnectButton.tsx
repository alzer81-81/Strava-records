export function ConnectButton() {
  return (
    <a
      href="/api/auth/strava/start"
      className="inline-flex items-center justify-center rounded-full bg-ember px-6 py-3 text-white shadow-soft transition hover:translate-y-[-1px]"
    >
      Connect Strava
    </a>
  );
}
