import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/settings", label: "Settings" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bg-sand">
      <header className="sticky top-0 z-10 border-b border-sand bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slateish">Strava Records</p>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
          </div>
          <nav className="flex items-center gap-3 text-sm text-slateish">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slateish/20 px-4 py-2 transition hover:border-slateish/40"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
