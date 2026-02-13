import Link from "next/link";
import Image from "next/image";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bg-[#f5f5f5]">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-center text-xs text-slate-500">
        <div className="mb-3 flex justify-center">
          <Image
            src="/powered_by_strava.png"
            alt="Powered by Strava"
            width={160}
            height={42}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/settings" className="underline decoration-slateish/30 underline-offset-4">
            Settings
          </Link>
          <Link href="/privacy" className="underline decoration-slateish/30 underline-offset-4">
            Privacy
          </Link>
          <Link href="/terms" className="underline decoration-slateish/30 underline-offset-4">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
