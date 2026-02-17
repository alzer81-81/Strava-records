import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(request: Request) {
  const formData = await request.formData();
  const distanceUnit = formData.get("distanceUnit");
  const redirectToRaw = formData.get("redirectTo");

  const redirectTo =
    typeof redirectToRaw === "string" && redirectToRaw.startsWith("/")
      ? redirectToRaw
      : "/settings";

  const store = cookies();

  if (distanceUnit === "km" || distanceUnit === "mi") {
    store.set("bt_distance_unit", distanceUnit, {
      httpOnly: false,
      sameSite: "lax",
      secure: IS_PROD,
      path: "/",
      maxAge: ONE_YEAR_SECONDS
    });
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
