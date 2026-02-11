import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/settings", label: "Settings" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bg-sand">
      <header className="sticky top-0 z-10 border-b border-sand bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-4 text-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slateish">Strava Records</p>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-center text-sm text-slateish">
        <Link href="/settings" className="underline decoration-slateish/30 underline-offset-4">
          Settings
        </Link>
      </footer>
    </div>
  );
}
