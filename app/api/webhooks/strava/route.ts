import { NextResponse } from "next/server";

// TODO: Implement Strava webhook subscription handshake and event handling.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hubChallenge = searchParams.get("hub.challenge");
  const hubMode = searchParams.get("hub.mode");
  const hubVerifyToken = searchParams.get("hub.verify_token");

  if (hubMode && hubChallenge) {
    return NextResponse.json({ "hub.challenge": hubChallenge });
  }

  return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
}

export async function POST() {
  // TODO: Handle create/update/delete event and resync activity.
  return NextResponse.json({ ok: true });
}
