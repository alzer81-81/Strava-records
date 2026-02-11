import Link from "next/link";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bg-sand">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-center text-sm text-slateish">
        <Link href="/settings" className="underline decoration-slateish/30 underline-offset-4">
          Settings
        </Link>
      </footer>
    </div>
  );
}
