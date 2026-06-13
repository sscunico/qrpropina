import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signInAdmin } from "@/lib/auth";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  getGoogleUserInfo,
  googleEmailIsAllowed,
  readGoogleOAuthState
} from "@/lib/googleAuth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const cookieStore = await cookies();
  const storedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);

  if (oauthError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(oauthError)}`, request.url));
  }

  const parsedState = readGoogleOAuthState(state, storedState);
  if (!code || !parsedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", request.url));
  }

  try {
    const token = await exchangeGoogleCode(code);
    const profile = await getGoogleUserInfo(token.access_token);

    if (!profile.email_verified || !googleEmailIsAllowed(profile.email)) {
      return NextResponse.redirect(new URL("/login?error=not_allowed", request.url));
    }

    await signInAdmin(profile.email);
    return NextResponse.redirect(new URL(parsedState.next, request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_failed", request.url));
  }
}
