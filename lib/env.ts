import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  STRAVA_REDIRECT_URI: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  BASE_URL: z.string().url()
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Missing or invalid env vars: ${missing}`);
}

export const env = parsed.data;
