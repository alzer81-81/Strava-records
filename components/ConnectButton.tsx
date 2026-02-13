export function ConnectButton() {
  return (
    <a
      href="/api/auth/strava/start"
      className="inline-flex h-12 items-center justify-center rounded-full border border-[#FC5200] bg-[#FC5200] px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-punch transition duration-150 hover:-translate-y-0.5 hover:brightness-110"
    >
      Connect with Strava
    </a>
  );
}
