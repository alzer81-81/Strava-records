import Link from "next/link";
import Image from "next/image";
import { TopNav } from "./TopNav";
import { readSessionCookie } from "../lib/session";

export function AppShell({ children }: { children: React.ReactNode }) {
  const session = readSessionCookie();

  return (
    <div className="app-shell bg-[#F6F6F6]">
      <TopNav avatarUrl={session?.avatarUrl ?? null} displayName={session?.displayName ?? null} />
      <main className="mx-auto max-w-6xl px-6 pt-0 pb-6 md:pb-8">{children}</main>
      <footer className="bg-[#F6F6F6]">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 text-xs text-slate-500">
          <div className="flex flex-col gap-4 border-t border-black/10 pt-5 md:grid md:grid-cols-3 md:items-end">
            <div className="order-2 flex md:order-1 md:justify-start">
              <Link
                href="/settings"
                className="inline-flex items-center rounded-md border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition-colors hover:bg-white"
              >
                Settings
              </Link>
            </div>

            <div className="order-1 text-center md:order-2">
              <div className="mb-2 flex justify-center">
                <Image
                  src="/powered_by_strava.png"
                  alt="Powered by Strava"
                  width={160}
                  height={42}
                />
              </div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                Built for funners chasing momentum
              </p>
            </div>

            <div className="order-3 flex items-center justify-start gap-3 md:justify-end">
              <Link href="/privacy" className="underline decoration-slateish/30 underline-offset-4">
                Privacy
              </Link>
              <Link href="/terms" className="underline decoration-slateish/30 underline-offset-4">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
