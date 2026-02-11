import { NextResponse } from "next/server";
import { getStravaAuthUrl } from "../../../../../lib/strava";
import { setOAuthState } from "../../../../../lib/oauth";

export async function GET() {
  const state = setOAuthState();
  const url = getStravaAuthUrl(state);
  return NextResponse.redirect(url);
}
