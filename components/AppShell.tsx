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
                className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition-colors hover:bg-white"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M10 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3 10c0-.42.03-.84.1-1.24l2.02-.31a5.5 5.5 0 01.6-1.44L4.5 5.35A7.07 7.07 0 016.35 3.5L8 4.72a5.5 5.5 0 011.44-.6l.31-2.02A7.64 7.64 0 0111.24 2c.42 0 .84.03 1.24.1l.31 2.02c.5.12.99.33 1.44.6l1.66-1.22A7.07 7.07 0 0117.5 5.35L16.28 7c.27.45.48.93.6 1.44l2.02.31c.07.4.1.82.1 1.24s-.03.84-.1 1.24l-2.02.31a5.5 5.5 0 01-.6 1.44l1.22 1.66a7.07 7.07 0 01-1.85 1.85L14.99 15.3a5.5 5.5 0 01-1.44.6l-.31 2.02c-.4.07-.82.1-1.24.1a7.64 7.64 0 01-1.24-.1l-.31-2.02a5.5 5.5 0 01-1.44-.6l-1.66 1.22A7.07 7.07 0 013.5 14.65L4.72 13a5.5 5.5 0 01-.6-1.44L2.1 11.24A7.64 7.64 0 012 10z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
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
