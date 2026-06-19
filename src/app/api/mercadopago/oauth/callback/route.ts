import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectCreatorMercadoPago, getAppSettings } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { MERCADOPAGO_OAUTH_COOKIE, exchangeOAuthCode, parseOAuthState } from "@/lib/mercadopago";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  let creatorIdForRedirect: string | null = null;
  const cookieStore = await cookies();
  const storedCookie = cookieStore.get(MERCADOPAGO_OAUTH_COOKIE)?.value;

  cookieStore.delete(MERCADOPAGO_OAUTH_COOKIE);

  if (oauthError) {
    return NextResponse.redirect(new URL(`/admin?mpError=${encodeURIComponent(oauthError)}`, appUrl()));
  }

  if (!code) {
    return NextResponse.json({ error: "Missing OAuth code." }, { status: 400 });
  }

  try {
    const { creatorId, codeVerifier } = parseOAuthState(state, storedCookie);
    creatorIdForRedirect = creatorId;
    const settings = await getAppSettings();
    if (!settings.showMercadoPagoIntegration) {
      return NextResponse.redirect(new URL(`/admin/creadores/${creatorId}?section=qrs`, appUrl()));
    }

    const tokens = await exchangeOAuthCode(code, codeVerifier);

    await connectCreatorMercadoPago(creatorId, {
      userId: tokens.account?.userId || tokens.userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      account: tokens.account
    });

    return NextResponse.redirect(new URL(`/admin/creadores/${creatorId}?section=mercadopago&mp=connected`, appUrl()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth failed.";
    const path = creatorIdForRedirect
      ? `/admin/creadores/${creatorIdForRedirect}`
      : "/admin";
    const url = new URL(path, appUrl());
    url.searchParams.set("section", "mercadopago");
    url.searchParams.set("mpError", message);
    return NextResponse.redirect(url);
  }
}
