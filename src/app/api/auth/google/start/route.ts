import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  createGoogleOAuthState,
  googleAuthorizationUrl,
  googleOAuthIsConfigured
} from "@/lib/googleAuth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next");

  if (!googleOAuthIsConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", appUrl()));
  }

  const { state } = createGoogleOAuthState(next);
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://")
  });

  return NextResponse.redirect(googleAuthorizationUrl(state));
}
