import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signInUser } from "@/lib/auth";
import { ADMIN_NOTIFICATIONS_ID, createNotificationRecord, upsertGoogleUser } from "@/lib/db";
import { appUrl } from "@/lib/env";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  getGoogleUserInfo,
  readGoogleOAuthState
} from "@/lib/googleAuth";

function appRedirect(path: string) {
  return NextResponse.redirect(new URL(path, appUrl()));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const cookieStore = await cookies();
  const storedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);

  if (oauthError) {
    return appRedirect(`/login?error=${encodeURIComponent(oauthError)}`);
  }

  const parsedState = readGoogleOAuthState(state, storedState);
  if (!code || !parsedState) {
    return appRedirect("/login?error=oauth_state");
  }

  try {
    const token = await exchangeGoogleCode(code);
    const profile = await getGoogleUserInfo(token.access_token);

    if (!profile.email_verified) {
      return appRedirect("/login?error=not_allowed");
    }

    const { user, isNewUser } = await upsertGoogleUser({
      email: profile.email,
      name: profile.name,
      picture: profile.picture
    });

    if (isNewUser && user.role !== "admin") {
      await createNotificationRecord({
        creatorId: ADMIN_NOTIFICATIONS_ID,
        title: "Nuevo usuario creado",
        body: user.name || user.email,
        photoUrl: user.picture
      });
    }

    await signInUser(user, {
      name: profile.name,
      picture: profile.picture
    });
    return appRedirect(parsedState.next);
  } catch {
    return appRedirect("/login?error=google_failed");
  }
}
