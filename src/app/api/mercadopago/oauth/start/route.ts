import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAppSettings, getCreatorWithTips } from "@/lib/db";
import { appUrl } from "@/lib/env";
import {
  MERCADOPAGO_OAUTH_COOKIE,
  buildOAuthRequest,
  createOAuthCookieValue
} from "@/lib/mercadopago";

export async function GET(request: Request) {
  const session = await requireUser();

  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creatorId") || searchParams.get("recipientId");

  if (!creatorId) {
    return NextResponse.json({ error: "creatorId is required." }, { status: 400 });
  }

  const creator = await getCreatorWithTips(creatorId, 0);

  if (!creator) {
    return NextResponse.json({ error: "Creator not found." }, { status: 404 });
  }

  const settings = await getAppSettings();
  if (!settings.showMercadoPagoIntegration) {
    const url = new URL(`/admin/creadores/${creator.id}`, appUrl());
    url.searchParams.set("section", "qrs");
    return NextResponse.redirect(url);
  }

  const canConnect =
    session.role === "admin" || (session.role === "creator" && session.creatorId === creator.id);

  if (!canConnect) {
    return NextResponse.json({ error: "No tenés permiso para conectar esta cuenta." }, { status: 403 });
  }

  try {
    const oauth = buildOAuthRequest(creator.id);
    const cookieStore = await cookies();
    cookieStore.set(MERCADOPAGO_OAUTH_COOKIE, createOAuthCookieValue(oauth), {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://")
    });

    return NextResponse.redirect(oauth.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth is not configured.";
    const url = new URL(`/admin/creadores/${creator.id}`, appUrl());
    url.searchParams.set("section", "mercadopago");
    url.searchParams.set("mpError", message);
    return NextResponse.redirect(url);
  }
}
