import type { MetadataRoute } from "next";

const siteUrl = process.env.BASE_URL ?? "https://best-times-run.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/privacy", "/terms"];
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.6
  }));
}
