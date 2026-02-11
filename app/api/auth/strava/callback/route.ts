import { NextResponse } from "next/server";
import { exchangeCodeForToken } from "../../../../../lib/strava";
import { prisma } from "../../../../../lib/db";
import { setSessionCookie } from "../../../../../lib/session";
import { clearOAuthState, readOAuthState } from "../../../../../lib/oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = readOAuthState();

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  clearOAuthState();
  const token = await exchangeCodeForToken(code);

  if (!token.athlete?.id) {
    throw new Error("Missing athlete id from Strava");
  }

  const athleteId = String(token.athlete.id);

  const user = await prisma.user.upsert({
    where: { stravaAthleteId: athleteId },
    create: {
      stravaAthleteId: athleteId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
      plan: "FREE"
    },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at
    }
  });

  setSessionCookie({ userId: user.id });

  return NextResponse.redirect(new URL("/home", request.url));
}
