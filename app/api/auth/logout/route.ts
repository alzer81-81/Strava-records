import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/session";

export async function POST(request: Request) {
  clearSessionCookie();
  return NextResponse.redirect(new URL("/", request.url));
}
