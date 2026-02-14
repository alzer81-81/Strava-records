import "../styles/globals.css";
import { Fraunces, Manrope } from "next/font/google";
import type { Metadata } from "next";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const siteUrl = process.env.BASE_URL ?? "https://best-times-run.vercel.app";
const metadataBase = new URL(siteUrl);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Best Times",
    template: "%s | Best Times"
  },
  description: "Best Times turns your Strava activities into clean records, totals, and performance dashboards.",
  applicationName: "Best Times",
  keywords: [
    "Best Times",
    "Strava analytics",
    "running records",
    "activity dashboard",
    "Strava dashboard"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Best Times",
    title: "Best Times",
    description: "Track your records, compare time windows, and view clean Strava performance analytics.",
    images: [
      {
        url: "/open_graph.png",
        width: 1200,
        height: 630,
        alt: "Best Times"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Times",
    description: "Track your records, compare time windows, and view clean Strava performance analytics.",
    images: ["/open_graph.png"]
  },
  icons: {
    icon: [
      { url: "/bt_icon.png?v=3", type: "image/png" }
    ],
    shortcut: ["/bt_icon.png?v=3"],
    apple: [
      { url: "/bt_icon.png?v=3", type: "image/png" }
    ]
  },
  category: "sports",
  robots: {
    index: true,
    follow: true
  }
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
