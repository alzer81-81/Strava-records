export function ConnectButton() {
  return (
    <a
      href="/api/auth/strava/start"
      className="inline-flex h-12 items-center justify-center rounded-full bg-[#FC5200] px-6 text-white shadow-soft transition hover:translate-y-[-1px]"
    >
      Connect with Strava
    </a>
  );
}
