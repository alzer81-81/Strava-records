import type { MetadataRoute } from "next";

const siteUrl = process.env.BASE_URL ?? "https://best-times-run.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
