import { z } from "zod";
import { env } from "./env";
import { fetchWithTimeout } from "./http";

const STRAVA_BASE = "https://www.strava.com";
const STRAVA_API = "https://www.strava.com/api/v3";

export function getStravaAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    redirect_uri: env.STRAVA_REDIRECT_URI,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
    state
  });
  return `${STRAVA_BASE}/oauth/authorize?${params.toString()}`;
}

const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  athlete: z
    .object({
      id: z.number(),
      firstname: z.string().nullable().optional(),
      lastname: z.string().nullable().optional(),
      profile_medium: z.string().nullable().optional(),
      profile: z.string().nullable().optional()
    })
    .optional()
});

export async function exchangeCodeForToken(code: string) {
  const response = await fetchWithTimeout(`${STRAVA_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code"
    }).toString(),
    timeoutMs: 10000
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava token exchange failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return TokenResponseSchema.parse(json);
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetchWithTimeout(`${STRAVA_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    }).toString(),
    timeoutMs: 10000
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava refresh failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return TokenResponseSchema.parse(json);
}

const ActivitySchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  start_date: z.string(),
  timezone: z.string().optional(),
  sport_type: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  elapsed_time: z.number(),
  total_elevation_gain: z.number(),
  average_speed: z.number().optional(),
  max_speed: z.number().optional(),
  average_heartrate: z.number().nullable().optional(),
  start_latlng: z.array(z.number()).nullable().optional(),
  map: z
    .object({
      summary_polyline: z.string().nullable().optional()
    })
    .optional()
});

export type StravaActivity = z.infer<typeof ActivitySchema>;

export async function listActivities(params: {
  accessToken: string;
  after: number;
  before: number;
  page?: number;
  perPage?: number;
}) {
  const { accessToken, after, before, page = 1, perPage = 50 } = params;
  const query = new URLSearchParams({
    after: String(after),
    before: String(before),
    page: String(page),
    per_page: String(perPage)
  });

  const response = await fetchWithTimeout(`${STRAVA_API}/athlete/activities?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    timeoutMs: 10000
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava list activities failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return z.array(ActivitySchema).parse(json);
}

const DetailedActivitySchema = ActivitySchema.extend({
  best_efforts: z
    .array(
      z.object({
        name: z.string(),
        elapsed_time: z.number(),
        moving_time: z.number(),
        distance: z.number()
      })
    )
    .optional()
});

export type StravaDetailedActivity = z.infer<typeof DetailedActivitySchema>;

export async function getActivityDetail(params: {
  accessToken: string;
  activityId: string;
}) {
  const response = await fetchWithTimeout(`${STRAVA_API}/activities/${params.activityId}`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`
    },
    timeoutMs: 10000
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava activity detail failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return DetailedActivitySchema.parse(json);
}

const StreamDataSchema = z.object({ data: z.array(z.number()) });
const StreamsSchema = z
  .object({
    distance: StreamDataSchema.optional(),
    time: StreamDataSchema.optional()
  })
  .passthrough();

export async function getActivityStreams(params: {
  accessToken: string;
  activityId: string;
  keys: string[];
}) {
  const query = new URLSearchParams({
    keys: params.keys.join(","),
    key_by_type: "true"
  });

  const response = await fetchWithTimeout(`${STRAVA_API}/activities/${params.activityId}/streams?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`
    },
    timeoutMs: 10000
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava streams failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  const parsed = StreamsSchema.parse(json);
  return {
    distance: parsed.distance?.data ?? null,
    time: parsed.time?.data ?? null
  };
}

const AthleteStatsSchema = z.object({
  all_run_totals: z.object({ count: z.number() }).optional(),
  all_ride_totals: z.object({ count: z.number() }).optional(),
  all_swim_totals: z.object({ count: z.number() }).optional()
});

export async function getAthleteStats(params: { accessToken: string; athleteId: string }) {
  const response = await fetchWithTimeout(`${STRAVA_API}/athletes/${params.athleteId}/stats`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`
    },
    timeoutMs: 10000
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava athlete stats failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return AthleteStatsSchema.parse(json);
}
