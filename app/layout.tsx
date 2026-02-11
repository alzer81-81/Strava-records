import "../styles/globals.css";
import { Fraunces, Manrope } from "next/font/google";
import type { Metadata } from "next";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Strava Records",
  description: "Performance dashboards and records for Strava athletes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="font-[var(--font-manrope)]">
        {children}
      </body>
    </html>
  );
}
