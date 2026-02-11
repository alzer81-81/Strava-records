import crypto from "crypto";
import { cookies } from "next/headers";

const STATE_COOKIE = "sr_oauth_state";

export function setOAuthState() {
  const state = crypto.randomBytes(16).toString("hex");
  cookies().set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 5
  });
  return state;
}

export function readOAuthState() {
  return cookies().get(STATE_COOKIE)?.value ?? null;
}

export function clearOAuthState() {
  cookies().set({
    name: STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
