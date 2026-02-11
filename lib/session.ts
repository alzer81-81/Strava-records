import crypto from "crypto";
import { cookies } from "next/headers";
import { env } from "./env";

const COOKIE_NAME = "sr_session";

export type SessionData = {
  userId: string;
};

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", env.SESSION_SECRET)
    .update(value)
    .digest("base64url");
}

export function setSessionCookie(data: SessionData) {
  const payload = base64UrlEncode(JSON.stringify(data));
  const signature = sign(payload);
  const value = `${payload}.${signature}`;

  cookies().set({
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSessionCookie() {
  cookies().set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function readSessionCookie(): SessionData | null {
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie?.value) return null;
  const [payload, signature] = cookie.value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as SessionData;
    if (!decoded?.userId) return null;
    return decoded;
  } catch {
    return null;
  }
}
